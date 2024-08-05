import { createClientFromSettings } from "@/ai/client";
import { createCompletion } from "@/ai/createCompletion";
import { getMaxTokens } from "@/ai/getMaxTokens";
import { getUser } from "@/lib/auth/getUser";
import { capture } from "@/lib/capture";
import { getSettingsFromJSON } from "@/lib/getSettingsFromRequest";
import { isLocal } from "@/lib/isLocal";
import { log } from "@/lib/log";
import { createClient } from "@/lib/supabase/server";
import { canGenerate } from "@/server/usage/canGenerate";
import { insertGeneration } from "@/server/usage/insertGeneration";
import { createPaymentRequiredResponse } from "@/server/paymentRequiredResponse";

export async function POST(req: Request) {
  const body = await req.json();
  const settings = await getSettingsFromJSON(body);
  const user = await getUser();
  if (!isLocal()) {
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    if (!settings.apiKey && settings.model !== "cheap") {
      const client = createClient();
      const hasTokens = await canGenerate(client, user);

      if (!hasTokens) {
        return createPaymentRequiredResponse();
      }

      await insertGeneration({
        client,
        user,
        tokensUsed: 1,
        action: "help",
      });
    }
  }

  const { messages } = body;

  log(messages);

  const { usedOwnKey, preferredModel } = createClientFromSettings(settings);

  await capture(
    {
      type: "help",
      usedOwnKey,
      model: preferredModel,
    },
    req
  );

  const response = await createCompletion({
    settings,
    label: "help",
    user,
    body: {
      messages: [...messages],
      max_tokens: getMaxTokens(settings),
    },
  });

  log(response);

  const content = response.choices[0].message.content;

  log(content);

  return new Response(JSON.stringify(content), { status: 200 });
}
