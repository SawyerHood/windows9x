import { createClientFromSettings } from "@/ai/client";
import { getUser } from "@/lib/auth/getUser";
import { capture } from "@/lib/capture";
import { getSettingsFromJSON } from "@/lib/getSettingsFromRequest";
import { isLocal } from "@/lib/isLocal";
import { log } from "@/lib/log";

export async function POST(req: Request) {
  if (!isLocal()) {
    const user = await getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }
  }

  const body = await req.json();
  const { messages } = body;

  const settings = await getSettingsFromJSON(body);

  log(messages);

  const { client, usedOwnKey, preferredModel } =
    createClientFromSettings(settings);

  await capture({
    type: "chat",
    usedOwnKey,
  });

  const response = await client.chat.completions.create({
    model: preferredModel,
    messages: [...messages],
    max_tokens: 4000,
  });

  log(response);

  const content = response.choices[0].message.content;

  log(content);

  return new Response(JSON.stringify(content), { status: 200 });
}
