/**
 * GET /api/health-data/clinical-notes/[documentId]/preview
 *
 * Returns a short-lived signed URL for the original uploaded file (PDF/image).
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { getEngineSupabaseClient } from "@/lib/repositories/supabaseEngine";

type Params = { params: Promise<{ documentId: string }> };

const BUCKETS_TO_TRY = process.env.HEALTH_UPLOADS_BUCKET
  ? [process.env.HEALTH_UPLOADS_BUCKET]
  : ["health0uploads", "health-uploads"];

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { documentId } = await params;
  const prisma = getPrisma();
  const upload = await prisma.healthUpload.findFirst({
    where: { documentId, userEmail: session.user.email },
    select: { storagePath: true, mimeType: true, fileName: true },
  });

  if (!upload) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const supabase = getEngineSupabaseClient();
  let lastErr: unknown = null;
  for (const bucket of BUCKETS_TO_TRY) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(upload.storagePath, 60 * 10);
    if (!error && data?.signedUrl) {
      return NextResponse.json({
        ok: true,
        url: data.signedUrl,
        fileName: upload.fileName,
        mimeType: upload.mimeType,
        bucket,
        path: upload.storagePath,
        expiresInSeconds: 600,
      });
    }
    lastErr = error;
  }

  return NextResponse.json(
    { error: "Failed to create preview URL", detail: lastErr ? String((lastErr as any).message ?? lastErr) : null },
    { status: 500 }
  );
}

