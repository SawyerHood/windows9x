import { createClientFromSettings, getModel } from "@/ai/client";
import { generateIcon } from "@/ai/image";
import { getUser } from "@/lib/auth/getUser";
import { getSettingsFromJSON } from "@/lib/getSettingsFromRequest";
import isLive from "@/lib/isLive";
import { put } from "@/lib/put";
import { Settings } from "@/state/settings";

export async function POST(req: Request) {
  if (!isLive) {
    return new Response(JSON.stringify({ error: "Not live" }), { status: 400 });
  }

  const user = await getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const body = await req.json();
  const settings = await getSettingsFromJSON(body);
  const prompt = body.name;
  const imagePrompt = await genImagePrompt(prompt, settings);
  if (!imagePrompt) {
    return new Response("", { status: 500 });
  }
  const image = await generateIcon(imagePrompt);
  if (!image) {
    return new Response("", { status: 500 });
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

const imageDescriptionPrompt = `You will be given the name of an application. Return a description of the icon that can be fed into stable diffusion to generate an icon for the application. Return only the description, do not return any other text.`;

async function genImagePrompt(name: string, settings: Settings) {
  const { client, mode } = createClientFromSettings(settings);
  const result = await client.chat.completions.create({
    model: getModel(mode),
    messages: [
      { role: "system", content: imageDescriptionPrompt },
      { role: "user", content: name },
    ],
  });

  return result.choices[0].message.content;
}
