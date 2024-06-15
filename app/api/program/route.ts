import { CHEAP_MODEL, MODEL, openai } from "@/ai/client";
import { ChatCompletionCreateParamsStreaming } from "openai/resources/index.mjs";
import { streamHtml } from "openai-html-stream";
import { getApiText } from "@/utils/apiText";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const desc = url.searchParams.get("description");
  const keys = JSON.parse(url.searchParams.get("keys") ?? "[]");
  if (!desc) {
    return new Response("No description", {
      status: 404,
    });
  }

  const programStream = await createProgramStream(desc, keys);
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
  console.log(keys);
  return `You will be creating a fantastical application for the Windows96 operating system, an alternate reality version of Windows from 1996. I will provide you with the name of an application exe file, and your job is to imagine what that application would do and generate the code to implement it.
The application name will be provided in this variable:
<app_name>
{{APP_NAME}}
</app_name>
First, take a moment to imagine what an application called <app_name> might do on the Windows96 operating system. Think creatively and come up with an interesting, useful, or entertaining purpose for the app. Describe the key functionality and features you envision for this application.
Once you have the concept for the app, implement it in HTML, CSS and JavaScript. Use the 98.css library to give it a Windows96 look and feel, the library has already been included for you. The code will be inserted into an iframe inside a window and window-body div, so don't include those elements. Don't use fixed widths, and avoid using images. Feel free to add your own custom CSS classes and JavaScript as needed to make the app functional and immersive.
Don't use external images, prefer drawing the assets yourself.

Make the programs fill the entire screen.

Don't include any other text, commentary or explanations, just the raw HTML/CSS/JS. Make sure that the page is standalone and is wrapped in <html> tags
Remember, you have full creative freedom to imagine a captivating application that fits the name provided. Aim to create something functional yet unexpected that transports the user into the alternate world of the Windows96 operating system. Focus on crafting clean, well-structured code that brings your vision to life.


The Operating System provides a few apis that your application can use. These are defined on window:

${getApiText(keys)}
`;
}

async function createProgramStream(desc: string, keys: string[]) {
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
    model: MODEL,
    temperature: 1,
    max_tokens: 4000,
    stream: true,
  };

  const stream = await openai.chat.completions.create(
    params as ChatCompletionCreateParamsStreaming
  );

  return stream;
}
