import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateDocumentChatAnswer } from "@/lib/gemini";
import { retrieveTopChunks, CHUNK_THRESHOLD_CHARS } from "@/lib/chunking";

interface Params {
  params: Promise<{ token: string }>;
}

export async function GET(req: Request, { params }: Params) {
  try {
    const { token } = await params;
    const { searchParams } = new URL(req.url);
    const viewerId = searchParams.get("viewerId");

    if (!viewerId) {
      return NextResponse.json(
        { error: "viewerId parameter is required" },
        { status: 400 }
      );
    }

    const pdf = await prisma.pdf.findUnique({
      where: { shareToken: token },
      select: { id: true },
    });

    if (!pdf) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        pdfId: pdf.id,
        viewerId,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching guest chat history:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat history" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { token } = await params;
    const body = await req.json();
    const { question, viewerId } = body;

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return NextResponse.json(
        { error: "Question cannot be empty" },
        { status: 400 }
      );
    }

    if (!viewerId || typeof viewerId !== "string") {
      return NextResponse.json(
        { error: "A valid viewer identifier is required" },
        { status: 400 }
      );
    }

    const pdf = await prisma.pdf.findUnique({
      where: { shareToken: token },
      include: {
        chunks: {
          orderBy: { chunkIndex: "asc" },
        },
      },
    });

    if (!pdf) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // 1. Fetch last 5 ChatMessage rows for (pdfId, viewerId)
    const historyRows = await prisma.chatMessage.findMany({
      where: {
        pdfId: pdf.id,
        viewerId,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const history = historyRows.reverse().map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // 2. Determine document context
    let contextToSend = pdf.extractedText;

    if (pdf.extractedText.length > CHUNK_THRESHOLD_CHARS || pdf.chunks.length > 0) {
      const chunkPool =
        pdf.chunks.length > 0
          ? pdf.chunks.map((c) => ({ index: c.chunkIndex, content: c.content }))
          : [];

      if (chunkPool.length > 0) {
        const topChunks = retrieveTopChunks(question, chunkPool, 5);
        contextToSend = topChunks
          .map((c) => `[Excerpt ${c.index + 1}]:\n${c.content}`)
          .join("\n\n---\n\n");
      }
    }

    // 3. Generate Gemini response
    const answer = await generateDocumentChatAnswer(
      contextToSend,
      history,
      question.trim()
    );

    // 4. Save both turns
    const [userMessage, assistantMessage] = await prisma.$transaction([
      prisma.chatMessage.create({
        data: {
          pdfId: pdf.id,
          viewerId,
          role: "user",
          content: question.trim(),
        },
      }),
      prisma.chatMessage.create({
        data: {
          pdfId: pdf.id,
          viewerId,
          role: "assistant",
          content: answer,
        },
      }),
    ]);

    return NextResponse.json({
      userMessage,
      assistantMessage,
      answer,
    });
  } catch (error) {
    console.error("Error in guest chat:", error);
    return NextResponse.json(
      { error: "Failed to generate answer" },
      { status: 500 }
    );
  }
}
