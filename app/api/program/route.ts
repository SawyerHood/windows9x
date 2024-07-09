import { ChatCompletionCreateParamsStreaming } from "openai/resources/index.mjs";
import { streamHtml } from "openai-html-stream";
import { getApiText } from "@/lib/apiText";

import { getSettingsFromGetRequest } from "@/lib/getSettingsFromRequest";
import { createClientFromSettings, getModel } from "@/ai/client";
import { Settings } from "@/state/settings";
import { getUser } from "@/lib/auth/getUser";
import { log } from "@/lib/log";
import { capture } from "@/lib/capture";
import { canGenerate } from "@/lib/usage/canGenerate";
import { createClient } from "@/lib/supabase/server";
import { insertGeneration } from "@/lib/usage/insertGeneration";

export async function GET(req: Request) {
  const settings = await getSettingsFromGetRequest(req);
  if (!process.env.LOCAL_MODE) {
    const user = await getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    if (!settings.apiKey) {
      const client = createClient();
      const hasTokens = await canGenerate(client, user);

      if (!hasTokens) {
        return new Response(JSON.stringify({ error: "No generations left" }), {
          status: 401,
        });
      }

      await insertGeneration({
        client,
        user,
        tokensUsed: 1,
        action: "program",
      });
    }
  }

  const url = new URL(req.url);

  const desc = url.searchParams.get("description");
  const keys = JSON.parse(url.searchParams.get("keys") ?? "[]");
  if (!desc) {
    return new Response("No description", {
      status: 404,
    });
  }

  const programStream = await createProgramStream(desc, keys, settings);
  return new Response(
    streamHtml(programStream, {
      injectIntoHead: `<script src="/api.js"></script>
<link
  rel="stylesheet" 
href="https://unpkg.com/98.css"
>
<link
  rel="stylesheet"
  href="/reset.css"
>`,
    }),
    {
      headers: {
        "Content-Type": "text/html",
      },
      status: 200,
    }
  );
}

function makeSystem(keys: string[]) {
  log(keys);
  return `You will be creating a fantastical application for the Windows9X operating system, an alternate reality version of Windows from 199X. I will provide you with the name of an application exe file, and your job is to imagine what that application would do and generate the code to implement it.
The application name will be provided in this variable:
<app_name>
{{APP_NAME}}
</app_name>
First, take a moment to imagine what an application called <app_name> might do on the Windows9X operating system. Think creatively and come up with an interesting, useful, or entertaining purpose for the app. Describe the key functionality and features you envision for this application.
Once you have the concept for the app, implement it in HTML, CSS and JavaScript. Use the 98.css library to give it a Windows9X look and feel, the library has already been included for you. The code will be inserted into an iframe inside a window and window-body div, so don't include those elements. Try not to make the root of the document hard coded in size, and avoid using images. Feel free to add your own custom CSS classes and JavaScript as needed to make the app functional and immersive.

- Don't use external images, prefer drawing the assets yourself.
- Don't ever use the 98.css \`window\` or \`window-body\` classes.
- Don't ever add a menu bar, the operating system will handle that for you.

Make the programs fill the entire screen.

Don't include any other text, commentary or explanations, just the raw HTML/CSS/JS. Make sure that the page is standalone and is wrapped in <html> tags
Remember, you have full creative freedom to imagine a captivating application that fits the name provided. Aim to create something functional yet unexpected that transports the user into the alternate world of the Windows9X operating system. Focus on crafting clean, well-structured code that brings your vision to life.


The Operating System provides a few apis that your application can use. These are defined on window:

${getApiText(keys)}
`;
}

async function createProgramStream(
  desc: string,
  keys: string[],
  settings: Settings
) {
  const { client, mode, usedOwnKey } = createClientFromSettings(settings);

  await capture({
    type: "program",
    usedOwnKey,
  });

  const params = {
    messages: [
      {
        role: "system",
        content: makeSystem(keys),
      },
      {
        role: "user",
        content: `<app_name>${desc}</app_name>`,
      },
    ],
    model: getModel(mode),
    temperature: 1,
    max_tokens: 4000,
    stream: true,
  };

  const stream = await client.chat.completions.create(
    params as ChatCompletionCreateParamsStreaming
  );

  return stream;
}
