import { createClientFromSettings } from "@/ai/client";
import { getUser } from "@/lib/auth/getUser";
import { capture } from "@/lib/capture";
import { getSettingsFromJSON } from "@/lib/getSettingsFromRequest";
import { isLocal } from "@/lib/isLocal";
import { log } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";
import { canGenerate } from "@/server/usage/canGenerate";
import { insertGeneration } from "@/server/usage/insertGeneration";

export async function POST(req: Request) {
  const body = await req.json();
  const settings = await getSettingsFromJSON(body);
  if (!isLocal()) {
    const user = await getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    if (!settings.apiKey && settings.model !== "cheap") {
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
        action: "chat",
      });
    }
  }

  const { messages } = body;

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
