/**
 * GET /api/ocr/[documentId]/sensitivity
 *   Returns the sensitivity profile for a document:
 *   sensitivity_level, privacy_tags, flagged_bins, tag_reasons.
 *
 *   Does NOT require the document itself to be sensitive — returns the profile
 *   for any document that has completed the full pipeline.
 *
 *   Note: reading the sensitivity profile itself is not audited (it contains no
 *   PHI — only metadata about sensitivity). Accessing the actual content routes
 *   (/extract, /bins, /classify, GET /api/ocr/[id]) triggers audit entries.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

type Params = { params: Promise<{ documentId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await params;
  const prisma = getPrisma();

  const upload = await prisma.healthUpload.findFirst({
    where: { documentId, userEmail: session.user.email },
    select: {
      documentId: true,
      fileName:   true,
      sensitivityProfile: {
        select: {
          sensitivityLevel: true,
          privacyTags:      true,
          flaggedBins:      true,
          tagReasons:       true,
          taggedAt:         true,
        },
      },
    },
  });

  if (!upload) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (!upload.sensitivityProfile) {
    return NextResponse.json(
      {
        error:
          "Sensitivity profile not yet available — pipeline may still be processing",
      },
      { status: 404 }
    );
  }

  const s = upload.sensitivityProfile;
  return NextResponse.json({
    documentId:       upload.documentId,
    fileName:         upload.fileName,
    sensitivityLevel: s.sensitivityLevel,
    privacyTags:      s.privacyTags,
    flaggedBins:      s.flaggedBins,
    tagReasons:       s.tagReasons,
    taggedAt:         s.taggedAt.toISOString(),
  });
}
