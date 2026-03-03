import { NextRequest } from "next/server";
import { requireAdminSession } from "@/lib/adminAuth";

/**
 * POST /api/admin/upload
 * Accepts multipart form "file" (image). Returns { url }.
 * When SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set, uploads to Supabase Storage bucket "uploads".
 * Otherwise returns 501 with message to configure or use the Cover image URL field.
 */
export async function POST(request: NextRequest) {
  const session = await requireAdminSession();
  if (!session) return new Response(null, { status: 401 });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return Response.json(
      {
        error:
          "Image upload not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or paste the image URL in the Cover image URL field.",
      },
      { status: 501 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return Response.json({ error: "Missing file" }, { status: 400 });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
  if (!allowedTypes.includes(file.type)) {
    return Response.json({ error: "Invalid file type. Use JPEG, PNG, WebP, GIF, or AVIF." }, { status: 400 });
  }

  const maxBytes = 5 * 1024 * 1024; // 5MB
  if (file.size > maxBytes) {
    return Response.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, supabaseKey);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `articles/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const buf = await file.arrayBuffer();
    const { data, error } = await supabase.storage.from("uploads").upload(path, buf, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(data.path);
    return Response.json({ url: urlData.publicUrl });
  } catch (err) {
    if (
      err instanceof Error &&
      (err.message.includes("Cannot find module") || err.message.includes("@supabase"))
    ) {
      return Response.json(
        {
          error:
            "Install @supabase/supabase-js and create an 'uploads' bucket. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or paste the image URL in the Cover image URL field.",
        },
        { status: 501 }
      );
    }
    return Response.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
