import { createClientFromSettings, getModel } from "@/ai/client";
import { getSettingsFromJSON } from "@/lib/getSettingsFromRequest";
import isLive from "@/lib/isLive";
import { log } from "@/lib/log";

export async function POST(req: Request) {
  if (!isLive) {
    return new Response(JSON.stringify({ error: "Not live" }), { status: 400 });
  }

  const body = await req.json();
  const { messages } = body;

  const settings = await getSettingsFromJSON(req);

  log(messages);

  const { client, mode } = createClientFromSettings(settings);

  const response = await client.chat.completions.create({
    model: getModel(mode),
    messages: [...messages],
    max_tokens: 4000,
  });

  log(response);

  const content = response.choices[0].message.content;

  log(content);

  return new Response(JSON.stringify(content), { status: 200 });
}
