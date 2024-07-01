import { createClientFromSettings, getModel } from "@/ai/client";
import { extractXMLTag } from "@/lib/extractXMLTag";
import { getSettingsFromJSON } from "@/lib/getSettingsFromRequest";

import isLive from "@/lib/isLive";

export async function POST(req: Request) {
  if (!isLive) {
    return new Response(JSON.stringify({ error: "Not live" }), { status: 400 });
  }

  const body = await req.json();
  const { desc } = body;

  const settings = await getSettingsFromJSON(body);
  const { client, mode } = createClientFromSettings(settings);

  const response = await client.chat.completions.create({
    model: getModel(mode),
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
  });

  console.log(response);

  const content = response.choices[0].message.content;

  const name = extractXMLTag(content!, "appname");

  return new Response(JSON.stringify({ name }), { status: 200 });
}

const prompt = `You are an expert application namer. The user will give you a description
of an application and you will create a simple name for it. These applications are for the
Windows9X operating system, a retrofuturistic operating system. make the names creative and 
whimsical. Put the name in <appname> tags.
`;
