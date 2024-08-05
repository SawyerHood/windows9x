import { createClientFromSettings, getCheapestModel } from "@/ai/client";
import { createCompletion } from "@/ai/createCompletion";
import { generateIcon } from "@/ai/image";
import { getUser } from "@/lib/auth/getUser";
import { capture } from "@/lib/capture";
import { getSettingsFromJSON } from "@/lib/getSettingsFromRequest";
import { isLocal } from "@/lib/isLocal";
import { put } from "@/lib/put";
import { createClient } from "@/lib/supabase/server";
import { canGenerate } from "@/server/usage/canGenerate";
import { Settings } from "@/state/settings";
import { User } from "@supabase/supabase-js";
import { createPaymentRequiredResponse } from "@/server/paymentRequiredResponse";

export async function POST(req: Request) {
  const user = await getUser();
  if (!isLocal()) {
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }
    const client = createClient();

    if (!(await canGenerate(client, user))) {
      return createPaymentRequiredResponse();
    }
  }

  const body = await req.json();
  const settings = await getSettingsFromJSON(body);
  const prompt = body.name;
  const imagePrompt = await genImagePrompt({
    name: prompt,
    settings,
    req,
    user,
  });
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

async function genImagePrompt({
  name,
  settings,
  req,
  user,
}: {
  name: string;
  settings: Settings;
  req: Request;
  user: User | null;
}) {
  const { mode, usedOwnKey } = createClientFromSettings(settings);
  await capture(
    {
      type: "icon",
      usedOwnKey,
      model: getCheapestModel(mode),
    },
    req
  );
  const result = await createCompletion({
    settings,
    label: "icon",
    user,
    forceModel: "cheap",
    body: {
      messages: [
        { role: "system", content: imageDescriptionPrompt },
        { role: "user", content: name },
      ],
    },
  });

  return result.choices[0].message.content;
}
