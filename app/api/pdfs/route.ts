import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractTextFromPdf } from "@/lib/pdf-extract";
import { generateDocumentSummary } from "@/lib/gemini";
import { uploadPdfToStorage } from "@/lib/supabase-storage";
import { splitTextIntoChunks, CHUNK_THRESHOLD_CHARS } from "@/lib/chunking";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

/**
 * GET /api/pdfs?q=
 * List the current user's PDFs with optional filename search
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    const pdfs = await prisma.pdf.findMany({
      where: {
        ownerId: session.user.id,
        ...(q
          ? {
              filename: {
                contains: q,
                mode: "insensitive",
              },
            }
          : {}),
      },
      orderBy: { uploadedAt: "desc" },
      select: {
        id: true,
        filename: true,
        summary: true,
        shareToken: true,
        uploadedAt: true,
        _count: {
          select: {
            comments: true,
            chatMessages: true,
          },
        },
      },
    });

    return NextResponse.json({ pdfs });
  } catch (error) {
    console.error("Error fetching PDFs:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pdfs
 * Upload, extract text, summarize with Gemini, and store PDF
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No PDF file provided" },
        { status: 400 }
      );
    }

    // Validation: PDF MIME type
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF documents are supported." },
        { status: 400 }
      );
    }

    // Validation: 20MB limit
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds the 20MB maximum size limit." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Extract text from PDF buffer
    let extractedText = "";
    try {
      const extraction = await extractTextFromPdf(buffer);
      extractedText = extraction.text;
    } catch (parseError) {
      console.warn("Could not extract clean text with pdf-parse:", parseError);
      extractedText = `Document: ${file.name}\n(Raw text could not be extracted directly from this PDF)`;
    }

    // 2. Generate Gemini summary (with map-reduce if > 700k characters)
    const { summary, wasChunked } = await generateDocumentSummary(extractedText);

    // 3. Upload file to Supabase Storage bucket
    const { storagePath, error: storageError } = await uploadPdfToStorage(
      session.user.id,
      file.name,
      buffer,
      file.type
    );

    if (storageError) {
      console.warn("Storage upload warning (proceeding with record):", storageError);
    }

    // 4. Create database record
    const pdf = await prisma.pdf.create({
      data: {
        ownerId: session.user.id,
        filename: file.name,
        storagePath,
        extractedText,
        summary,
      },
    });

    // 5. If document triggered chunking, persist chunks to PdfChunk
    if (wasChunked || extractedText.length > CHUNK_THRESHOLD_CHARS) {
      const chunks = splitTextIntoChunks(extractedText, 8000, 200);
      await prisma.pdfChunk.createMany({
        data: chunks.map((c) => ({
          pdfId: pdf.id,
          chunkIndex: c.index,
          content: c.content,
        })),
      });
      console.log(`Saved ${chunks.length} chunks for PDF ${pdf.id}`);
    }

    return NextResponse.json({ pdf }, { status: 201 });
  } catch (error) {
    console.error("PDF upload error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing the PDF." },
      { status: 500 }
    );
  }
}
