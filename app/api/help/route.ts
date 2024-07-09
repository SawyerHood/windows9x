import { createClientFromSettings, getModel } from "@/ai/client";
import { getUser } from "@/lib/auth/getUser";
import { capture } from "@/lib/capture";
import { getSettingsFromJSON } from "@/lib/getSettingsFromRequest";
import { log } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";
import { canGenerate } from "@/lib/usage/canGenerate";
import { insertGeneration } from "@/lib/usage/insertGeneration";

export async function POST(req: Request) {
  if (!process.env.LOCAL_MODE) {
    const user = await getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const client = createClient();
    const hasTokens = await canGenerate(client, user);

    if (!hasTokens) {
      return new Response(
        JSON.stringify(
          "No tokens left. Use a custom key or buy tokens to continue."
        ),
        {
          status: 401,
        }
      );
    }

    await insertGeneration({
      client,
      user,
      tokensUsed: 1,
      action: "help",
    });
  }

  const body = await req.json();
  const { messages } = body;

  const settings = await getSettingsFromJSON(req);

  log(messages);

  const { client, mode, usedOwnKey } = createClientFromSettings(settings);

  await capture({
    type: "chat",
    usedOwnKey,
  });

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
