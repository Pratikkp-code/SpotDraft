import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPdfSignedUrl } from "@/lib/supabase-storage";

interface Params {
  params: Promise<{ token: string }>;
}

export async function GET(req: Request, { params }: Params) {
  try {
    const { token } = await params;

    const pdf = await prisma.pdf.findUnique({
      where: { shareToken: token },
      include: {
        owner: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!pdf) {
      return NextResponse.json(
        { error: "Shared document not found or link expired" },
        { status: 404 }
      );
    }

    let downloadUrl: string | null = null;
    if (pdf.storagePath && !pdf.storagePath.startsWith("local/")) {
      downloadUrl = await getPdfSignedUrl(pdf.storagePath, 7200);
    }

    return NextResponse.json({
      pdf: {
        id: pdf.id,
        filename: pdf.filename,
        summary: pdf.summary,
        uploadedAt: pdf.uploadedAt,
        shareToken: pdf.shareToken,
        ownerName: pdf.owner.name,
        downloadUrl,
      },
    });
  } catch (error) {
    console.error("Error fetching shared PDF:", error);
    return NextResponse.json(
      { error: "Failed to retrieve shared document" },
      { status: 500 }
    );
  }
}
