import { createClient } from "@supabase/supabase-js";

export async function uploadProgressPhoto(
  userId: string,
  file: File
): Promise<string> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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
