import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function uploadProgressPhoto(
  userId: string,
  file: File
): Promise<string> {
  const supabase = getSupabaseClient();

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const fileName = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("progress-photos")
    .upload(fileName, file, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from("progress-photos")
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const supabase = getSupabaseClient();
  const fileName = `${userId}/avatar.jpg`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, { upsert: true, contentType: "image/jpeg" });

  if (error) throw error;

  const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
  return `${data.publicUrl}?t=${Date.now()}`;
}
