import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { regenerate } = body;

    const pdf = await prisma.pdf.findUnique({
      where: { id },
      select: { id: true, ownerId: true, shareToken: true, filename: true },
    });

    if (!pdf) {
      return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    }

    if (pdf.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this document" },
        { status: 403 }
      );
    }

    let shareToken = pdf.shareToken;

    if (regenerate) {
      const updated = await prisma.pdf.update({
        where: { id },
        data: {
          shareToken: `sh_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`,
        },
        select: { shareToken: true },
      });
      shareToken = updated.shareToken;
    }

    return NextResponse.json({
      shareToken,
      shareUrl: `/shared/${shareToken}`,
      filename: pdf.filename,
    });
  } catch (error) {
    console.error("Error in share route:", error);
    return NextResponse.json(
      { error: "Failed to generate share link" },
      { status: 500 }
    );
  }
}
