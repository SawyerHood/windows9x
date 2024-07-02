import { createClientFromSettings } from "@/ai/client";
import { getSettingsFromJSON } from "@/lib/getSettingsFromRequest";
import { getUser } from "@/lib/auth/getUser";
import isLive from "@/lib/isLive";

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
  const settings = await getSettingsFromJSON(req);

  const { client } = createClientFromSettings(settings);

  const response = await client.chat.completions.create({
    model: body.model,
    messages: body.messages,
    max_tokens: body.max_tokens,
    stream: body.stream,
    temperature: body.temperature,
    top_p: body.top_p,
    top_k: body.top_k
  });

  return new Response(JSON.stringify(response), { status: 200 });
}
