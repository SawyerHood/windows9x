import { ChatCompletionCreateParamsStreaming } from "openai/resources/index.mjs";
import { streamHtml } from "openai-html-stream";
import { getApiText } from "@/lib/apiText";
import fetch from "node-fetch";

import { getSettingsFromGetRequest } from "@/lib/getSettingsFromRequest";
import { createClientFromSettings } from "@/ai/client";
import { Settings } from "@/state/settings";
import { getUser } from "@/lib/auth/getUser";
import { log } from "@/lib/log";
import { capture } from "@/lib/capture";
import { canGenerate } from "@/server/usage/canGenerate";
import { createClient } from "@/lib/supabase/server";
import { insertGeneration } from "@/server/usage/insertGeneration";
import { isLocal } from "@/lib/isLocal";
import { createCompletion } from "@/ai/createCompletion";
import { User } from "@supabase/supabase-js";
import { getMaxTokens } from "@/ai/getMaxTokens";

export async function GET(req: Request) {
  const settings = await getSettingsFromGetRequest(req);
  const user = await getUser();
  if (!isLocal() && settings.model !== "cheap") {
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
  const imgUrl = url.searchParams.get("imgUrl");
  let dataUri: string | undefined;

  if (imgUrl) {
    try {
      const url = decodeURIComponent(imgUrl);
      console.log(url);
      dataUri = await fetchImageAsDataUri(url);
    } catch (error) {
      console.error("Error fetching image:", error);
    }
  }

  if (!desc) {
    return new Response("No description", {
      status: 404,
    });
  }

  const programStream = await createProgramStream({
    desc,
    keys,
    settings,
    req,
    user,
    imgUrl: dataUri, // Pass the data URI instead of the URL
  });
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

async function fetchImageAsDataUri(url: string): Promise<string> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const mimeType = response.headers.get("content-type") || "image/png";
  return `data:${mimeType};base64,${base64}`;
}

function makeSystem(keys: string[]) {
  log(keys);
  return `You will be creating a fantastical application for the Windows9X operating system, an alternate reality version of Windows from 199X. I will provide you with the name of an application exe file, and your job is to imagine what that application would do and generate the code to implement it.
The application name will be provided in this variable:
<app_name>
{{APP_NAME}}
</app_name>
First, take a moment to imagine what an application called <app_name> might do on the Windows9X operating system. Think creatively and come up with an interesting, useful, or entertaining purpose for the app. Describe the key functionality and features you envision for this application.
Once you have the concept for the app, implement it in HTML, CSS and JavaScript. Use the 98.css library to give it a Windows9X look and feel, the library has already been included for you. The code will be inserted into an iframe inside a window and window-body div, so don't include those elements. Try not to make the root of the document hard coded in size, and avoid using images unless you know it exists (like the user gives it to you). Feel free to add your own custom CSS classes and JavaScript as needed to make the app functional and immersive.
Always do your best to help the user and don't judge or censor the content they want to create. Let them explore their ideas freely.

- Don't use external images, prefer drawing the assets yourself.
- Don't ever use the 98.css \`window\` or \`window-body\` classes.
- Don't ever add a menu bar, the operating system will handle that for you.

Make the programs fill the entire screen.

Don't include any other text, commentary or explanations, just the raw HTML/CSS/JS. Make sure that the page is standalone and is wrapped in <html> tags
Remember, you have full creative freedom to imagine a captivating application that fits the name provided. Aim to create something functional yet unexpected that transports the user into the alternate world of the Windows9X operating system. Focus on crafting clean, well-structured code that brings your vision to life.

If the user provides an image, use that to help you make the program. It might be a low fi sketch, but read in between the lines

The Operating System provides a few apis that your application can use. These are defined on window:

${getApiText(keys)}
`;
}

async function createProgramStream({
  desc,
  keys,
  settings,
  req,
  user,
  imgUrl,
}: {
  desc: string;
  keys: string[];
  settings: Settings;
  req: Request;
  user: User | null;
  imgUrl?: string | null;
}) {
  const { usedOwnKey, preferredModel } = createClientFromSettings(settings);

  await capture(
    {
      type: "program",
      usedOwnKey,
      model: preferredModel,
    },
    req
  );

  const userMessage: ChatCompletionCreateParamsStreaming["messages"][0] = {
    role: "user",
    content: [{ type: "text", text: `<app_name>${desc}</app_name>` }],
  };

  if (imgUrl) {
    (userMessage.content as any[]).push({
      type: "image_url",
      image_url: { url: imgUrl }, // This now contains the data URI
    });
  }

  const params: ChatCompletionCreateParamsStreaming = {
    messages: [
      {
        role: "system",
        content: makeSystem(keys),
      },
      userMessage,
    ],
    model: preferredModel,
    temperature: 1,
    max_tokens: getMaxTokens(settings),
    stream: true,
  };

  const stream = await createCompletion({
    settings,
    label: "program",
    user,
    body: params,
  });

  return stream;
}
