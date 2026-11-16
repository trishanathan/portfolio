import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

let serverClient: SupabaseClient | null = null;
let publicClient: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  if (!serverClient) {
    serverClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return serverClient;
}

export function getSupabasePublicClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!publicClient) {
    publicClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return publicClient;
}

/**
 * Upload an image buffer directly to Supabase Storage in the 'uploads' bucket.
 * Returns the permanent public CDN URL.
 */
export async function uploadImageToSupabase(
  buffer: Buffer,
  fileName: string,
  folder: "gallery" | "films" | "slides" | "articles" = "gallery",
  contentType: string = "image/jpeg"
): Promise<string | null> {
  const client = getSupabaseServerClient();
  if (!client) return null;

  try {
    const filePath = `${folder}/${fileName}`;
    const { data, error } = await client.storage
      .from("uploads")
      .upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error("Supabase Storage upload error:", error);
      return null;
    }

    const { data: pubData } = client.storage.from("uploads").getPublicUrl(filePath);
    return pubData?.publicUrl || null;
  } catch (err) {
    console.error("Supabase upload exception:", err);
    return null;
  }
}

/**
 * Delete an image from Supabase Storage given its URL.
 */
export async function deleteImageFromSupabase(fileUrl: string): Promise<boolean> {
  const client = getSupabaseServerClient();
  if (!client || !fileUrl) return false;

  try {
    // URL pattern: .../uploads/<folder>/<filename>
    const match = fileUrl.match(/\/uploads\/([^?]+)/);
    if (!match) return false;
    const pathInBucket = match[1];

    const { error } = await client.storage.from("uploads").remove([pathInBucket]);
    if (error) {
      console.warn("Supabase Storage delete warning:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Supabase delete exception:", err);
    return false;
  }
}

