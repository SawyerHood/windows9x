import { createClient } from "./supabase/server";

export async function put(path: string, blob: Blob) {
  const supabase = createClient();

  const { error } = await supabase.storage.from("icons").upload(path, blob);

  if (error) {
    throw error;
  }

  return (await supabase.storage.from("icons").getPublicUrl(path)).data
    .publicUrl;
}
