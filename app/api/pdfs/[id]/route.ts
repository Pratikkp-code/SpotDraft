import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPdfSignedUrl } from "@/lib/supabase-storage";

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

    const pdf = await prisma.pdf.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
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

    // Attempt to generate signed storage URL
    let downloadUrl: string | null = null;
    if (pdf.storagePath && !pdf.storagePath.startsWith("local/")) {
      downloadUrl = await getPdfSignedUrl(pdf.storagePath, 7200);
    }

    return NextResponse.json({
      pdf: {
        ...pdf,
        downloadUrl,
      },
    });
  } catch (error) {
    console.error("Error fetching single PDF:", error);
    return NextResponse.json(
      { error: "Failed to retrieve document" },
      { status: 500 }
    );
  }
}
