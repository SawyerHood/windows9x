import { createClientFromSettings, getCheapestModel } from "@/ai/client";
import { createCompletion } from "@/ai/createCompletion";
import { getUser } from "@/lib/auth/getUser";
import { capture } from "@/lib/capture";
import { extractXMLTag } from "@/lib/extractXMLTag";
import { getSettingsFromJSON } from "@/lib/getSettingsFromRequest";
import { isLocal } from "@/lib/isLocal";

import { log } from "@/lib/log";

export async function POST(req: Request) {
  const user = await getUser();
  if (!isLocal()) {
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }
  }

  const body = await req.json();
  const { desc } = body;

  const settings = await getSettingsFromJSON(body);
  const { mode, usedOwnKey } = createClientFromSettings(settings);

  await capture(
    {
      type: "name",
      usedOwnKey,
      model: getCheapestModel(mode),
    },
    req
  );

  const response = await createCompletion({
    settings,
    label: "name",
    user,
    forceModel: "cheap",
    body: {
      messages: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: desc,
        },
      ],
      max_tokens: 4000,
    },
  });

  log(response);

  const content = response.choices[0].message.content;

  const name = extractXMLTag(content!, "appname");

  return new Response(JSON.stringify({ name }), { status: 200 });
}

const prompt = `You are an expert application namer. The user will give you a description
of an application and you will create a simple name for it. These applications are for the
Windows9X operating system, a retrofuturistic operating system. make the names creative and 
whimsical. Put the name in <appname> tags.
`;
