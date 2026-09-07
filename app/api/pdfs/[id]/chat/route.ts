import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateDocumentChatAnswer } from "@/lib/gemini";
import { retrieveTopChunks, CHUNK_THRESHOLD_CHARS } from "@/lib/chunking";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const viewerId = session.user.id;

    const messages = await prisma.chatMessage.findMany({
      where: {
        pdfId: id,
        viewerId,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return NextResponse.json(
      { error: "Failed to retrieve chat history" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const viewerId = session.user.id;
    const body = await req.json();
    const { question } = body;

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    const pdf = await prisma.pdf.findUnique({
      where: { id },
      include: {
        chunks: {
          orderBy: { chunkIndex: "asc" },
        },
      },
    });

    if (!pdf) {
      return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    }

    if (pdf.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 1. Fetch last 5 ChatMessage rows for (pdfId, viewerId)
    const historyRows = await prisma.chatMessage.findMany({
      where: {
        pdfId: id,
        viewerId,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Reverse to chronological order (oldest to newest)
    const history = historyRows.reverse().map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // 2. Determine document context to send
    let contextToSend = pdf.extractedText;

    if (pdf.extractedText.length > CHUNK_THRESHOLD_CHARS || pdf.chunks.length > 0) {
      console.log(
        `[CHUNKING ACTIVATED] Retrieving top-k chunks for query: "${question.substring(0, 60)}..."`
      );

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

    // 3. Call Gemini with chat prompt
    const answer = await generateDocumentChatAnswer(
      contextToSend,
      history,
      question.trim()
    );

    // 4. Store user message and assistant reply
    const [userMessage, assistantMessage] = await prisma.$transaction([
      prisma.chatMessage.create({
        data: {
          pdfId: id,
          viewerId,
          role: "user",
          content: question.trim(),
        },
      }),
      prisma.chatMessage.create({
        data: {
          pdfId: id,
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
    console.error("Error generating chat answer:", error);
    return NextResponse.json(
      { error: "Failed to generate answer" },
      { status: 500 }
    );
  }
}
