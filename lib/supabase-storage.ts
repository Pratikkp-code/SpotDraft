import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const PDF_BUCKET = "pdfs";

let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return _supabaseAdmin;
}

/**
 * Uploads a PDF buffer to Supabase Storage
 */
export async function uploadPdfToStorage(
  userId: string,
  fileName: string,
  buffer: Buffer,
  contentType = "application/pdf"
): Promise<{ storagePath: string; error?: string }> {
  const supabase = getSupabaseAdmin();

  // Sanitize file name for URL/storage safety
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniqueStoragePath = `${userId}/${Date.now()}-${sanitizedFileName}`;

  if (!supabase) {
    console.warn(
      "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured. Falling back to mock/local path."
    );
    return { storagePath: `local/${userId}/${Date.now()}-${sanitizedFileName}` };
  }

  try {
    const { data, error } = await supabase.storage
      .from(PDF_BUCKET)
      .upload(uniqueStoragePath, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error("Supabase storage upload error:", error);
      return { storagePath: uniqueStoragePath, error: error.message };
    }

    return { storagePath: data?.path || uniqueStoragePath };
  } catch (err: unknown) {
    console.error("Storage upload exception:", err);
    return {
      storagePath: uniqueStoragePath,
      error: err instanceof Error ? err.message : "Upload failed",
    };
  }
}

/**
 * Creates a signed URL to safely download/view a PDF from storage
 */
export async function getPdfSignedUrl(
  storagePath: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase.storage
      .from(PDF_BUCKET)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      console.error("Failed to generate signed URL:", error);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.error("Exception getting signed URL:", err);
    return null;
  }
}
