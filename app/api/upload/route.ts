import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEngineSupabaseClient } from "@/lib/repositories/supabaseEngine";
import { getPrisma } from "@/lib/db";
import { spawn } from "child_process";
import path from "path";

const PYTHON =
  "/opt/homebrew/opt/python@3.10/Frameworks/Python.framework/Versions/3.10/bin/python3.10";

/** Fire-and-forget: spawn pipeline_runner.py detached so the HTTP response
 *  returns immediately while processing continues in the background. */
function spawnPipeline(documentId: string): void {
  const projectRoot = path.resolve(process.cwd());
  const script = path.join(projectRoot, "workers", "pipeline_runner.py");

  const child = spawn(PYTHON, [script, documentId], {
    detached: true,
    stdio:    "ignore",
    cwd:      projectRoot,
    env:      { ...process.env },
  });
  child.unref();
}

// Storage bucket for user health document uploads.
// If HEALTH_UPLOADS_BUCKET is not set, we auto-try a sensible fallback order:
// - health0uploads (legacy / user-expected)
// - health-uploads (current bucket in many environments)
const BUCKETS_TO_TRY = process.env.HEALTH_UPLOADS_BUCKET
  ? [process.env.HEALTH_UPLOADS_BUCKET]
  : ["health0uploads", "health-uploads"];
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB per file

const ALLOWED_MIME: Record<string, true> = {
  "application/pdf": true,
  "image/jpeg": true,
  "image/png": true,
};

// ── helpers ──────────────────────────────────────────────────────────────────

function sanitiseName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

async function uploadOneFile(
  file: File,
  userEmail: string
): Promise<{
  documentId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  storagePath: string;
  uploadTimestamp: string;
  processingStatus: string;
  ocrJobId: string;
}> {
  // ── validate ──────────────────────────────────────────────────────────────
  if (!ALLOWED_MIME[file.type]) {
    throw Object.assign(
      new Error("Unsupported file type. Upload a PDF, JPG, or PNG."),
      { statusCode: 422 }
    );
  }
  if (file.size > MAX_BYTES) {
    throw Object.assign(
      new Error(
        `File exceeds 20 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB).`
      ),
      { statusCode: 422 }
    );
  }

  // ── upload to Supabase Storage ────────────────────────────────────────────
  const timestamp = Date.now();
  const safeName = sanitiseName(file.name);
  const storagePath = `${userEmail}/${timestamp}_${safeName}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const supabase = getEngineSupabaseClient();

  let storageError: unknown = null;
  for (const bucket of BUCKETS_TO_TRY) {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, buffer, { contentType: file.type, upsert: false });
    if (!error) {
      storageError = null;
      break;
    }
    storageError = error;
  }

  if (storageError) {
    console.error("[upload] Supabase storage error", storageError);
    throw Object.assign(new Error("Storage upload failed. Please try again."), {
      statusCode: 500,
    });
  }

  // ── persist metadata ──────────────────────────────────────────────────────
  const prisma = getPrisma();

  const uploadRecord = await prisma.healthUpload.create({
    data: {
      userEmail,
      fileName: file.name,
      mimeType: file.type,
      fileSize: BigInt(file.size),
      storagePath,
      processingStatus: "queued",
    },
  });

  // ── create OCR job ────────────────────────────────────────────────────────
  const ocrJob = await prisma.ocrJob.create({
    data: {
      documentId: uploadRecord.documentId,
      status:     "queued",
    },
  });

  // ── auto-trigger pipeline (fire-and-forget background process) ────────────
  spawnPipeline(uploadRecord.documentId);

  return {
    documentId:       uploadRecord.documentId,
    fileName:         uploadRecord.fileName,
    mimeType:         uploadRecord.mimeType,
    fileSize:         Number(uploadRecord.fileSize),
    storagePath:      uploadRecord.storagePath,
    uploadTimestamp:  uploadRecord.uploadTimestamp.toISOString(),
    processingStatus: "processing",
    ocrJobId:         ocrJob.id,
  };
}

// ── route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Consent cookie
  if (req.cookies.get("arc_upload_consent")?.value !== "1") {
    return NextResponse.json({ error: "Consent required" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Collect all files — supports both single `file` and multi `files[]`
  const rawEntries = formData.getAll("file");
  const files = rawEntries.filter((e): e is File => e instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const userEmail = session.user.email;
  const results: Awaited<ReturnType<typeof uploadOneFile>>[] = [];
  const errors: { fileName: string; error: string }[] = [];

  for (const file of files) {
    try {
      const result = await uploadOneFile(file, userEmail);
      results.push(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Upload failed";
      errors.push({ fileName: file.name, error: message });
      console.error(`[upload] failed for ${file.name}:`, err);
    }
  }

  if (results.length === 0) {
    // All files failed
    return NextResponse.json(
      { error: errors[0]?.error ?? "Upload failed", errors },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      uploaded: results,
      ...(errors.length > 0 ? { partialErrors: errors } : {}),
    },
    { status: 200 }
  );
}
