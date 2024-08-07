import { createClientFromSettings } from "@/ai/client";
import { createCompletion } from "@/ai/createCompletion";
import { getMaxTokens } from "@/ai/getMaxTokens";
import { getUser } from "@/lib/auth/getUser";
import { capture } from "@/lib/capture";
import { getSettingsFromJSON } from "@/lib/getSettingsFromRequest";
import { isLocal } from "@/lib/isLocal";
import { log } from "@/lib/log";

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
  }

  const { messages } = body;

  log(messages);

  const { usedOwnKey, preferredModel } = createClientFromSettings({
    ...settings,
    model: "cheap",
  });

  await capture(
    {
      type: "chat",
      usedOwnKey,
      model: preferredModel,
    },
    req
  );

  const response = await createCompletion({
    settings,
    label: "chat",
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
