import { log } from "@/lib/log";
import Replicate from "replicate";

export async function generateIcon(prompt: string): Promise<Blob | null> {
  const replicate = new Replicate();

  const response = await replicate.run(
    "fofr/sticker-maker:4acb778eb059772225ec213948f0660867b2e03f277448f18cf1800b96a65a1a",
    {
      input: {
        prompt,
      },
    }
  );

  log(response);

  const url = Array.isArray(response) ? response[0] : null;

  if (!url) return null;

  const blob = await fetch(url).then((res) => res.blob());

  return blob;
}
