import { CHEAP_MODEL, openai } from "@/ai/client";
import { removeBackground } from "@/ai/removeBackground";
import { put } from "@/utils/put";

const REMOVE_BG = false;

export async function POST(req: Request) {
  const body = await req.json();
  const prompt = body.name;
  const imagePrompt = await genImagePrompt(prompt);
  if (!imagePrompt) {
    return new Response("", { status: 500 });
  }
  let image = await genCloudflareImage(imagePrompt);
  if (!image) {
    return new Response("", { status: 500 });
  }

  if (REMOVE_BG) {
    const noBg = await removeBackground(image);
    image = noBg;
  }
  const path = await put(`icons/${generateUniqueID()}.png`, image);
  return new Response(path, { status: 200 });
}

function generateUniqueID() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

async function toDataURL(blob: Blob) {
  const buffer = Buffer.from(await blob.arrayBuffer());
  return "data:" + blob.type + ";base64," + buffer.toString("base64");
}

const imageDescriptionPrompt = `You are a master icon designer for Microsoft in the 90s. A user will give you the name of an exe and you will describe an icon for it. Return an object or symbol that should be used as an icon. Return only the object or symbol`;

async function genImagePrompt(name: string) {
  const result = await openai.chat.completions.create({
    model: CHEAP_MODEL,
    messages: [
      { role: "system", content: imageDescriptionPrompt },
      { role: "user", content: name },
    ],
  });

  return result.choices[0].message.content + ", icon, 32x32, 16 colors";
}

async function genCloudflareImage(prompt: string): Promise<Blob | null> {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "image/jpeg",
      Authorization: `Bearer ${process.env.CLOUDFLARE_TOKEN}`,
    },
    body: JSON.stringify({ prompt }),
  };

  const resp = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/bytedance/stable-diffusion-xl-lightning`,
    options
  );

  if (!resp.ok) {
    console.error("Error generating image", await resp.text());
    console.error("resp", resp);
    return null;
  }

  return await resp.blob();
}
