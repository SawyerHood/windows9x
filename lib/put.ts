import { isLocal } from "./isLocal";
import { createClient } from "./supabase/server";

export async function put(path: string, blob: Blob): Promise<string> {
  if (isLocal()) {
    const fs = await import("fs-extra");

    const buffer = await blob.arrayBuffer();
    const data = Buffer.from(buffer);
    await fs.outputFile(`${process.cwd()}/public/blob/${path}`, data);

    return `http://localhost:3000/blob/${path}`;
  }
  const supabase = createClient();

  const { error } = await supabase.storage.from("icons").upload(path, blob);

  if (error) {
    throw error;
  }

  return (await supabase.storage.from("icons").getPublicUrl(path)).data
    .publicUrl;
}
