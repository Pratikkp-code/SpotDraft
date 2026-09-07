import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ token: string }>;
}

export async function GET(req: Request, { params }: Params) {
  try {
    const { token } = await params;

    const pdf = await prisma.pdf.findUnique({
      where: { shareToken: token },
      select: { id: true },
    });

    if (!pdf) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const comments = await prisma.comment.findMany({
      where: { pdfId: pdf.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Error fetching guest comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { token } = await params;
    const body = await req.json();
    const { content, authorName, parentId } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment content cannot be empty" },
        { status: 400 }
      );
    }

    const displayName =
      authorName && typeof authorName === "string" && authorName.trim().length > 0
        ? authorName.trim()
        : "Guest";

    const pdf = await prisma.pdf.findUnique({
      where: { shareToken: token },
      select: { id: true },
    });

    if (!pdf) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        pdfId: pdf.id,
        authorUserId: null,
        authorName: displayName,
        content: content.trim(),
        parentId: parentId || null,
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Error creating guest comment:", error);
    return NextResponse.json(
      { error: "Failed to submit comment" },
      { status: 500 }
    );
  }
}
