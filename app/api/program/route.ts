import { CHEAP_MODEL, MODEL, openai } from "@/ai/client";
import { ChatCompletionCreateParamsStreaming } from "openai/resources/index.mjs";

export function GET(req: Request) {
  const url = new URL(req.url);
  const desc = url.searchParams.get("description");
  if (!desc) {
    return new Response("No description", {
      status: 404,
    });
  }
  return new Response(
    new ReadableStream({
      async start(controller) {
        const programStream = await createProgramStream(desc);
        let programResult = "";

        let startedSending = false;
        let sentIndex = 0;

        for await (const chunk of programStream) {
          const value = chunk.choices[0]?.delta?.content || "";

          programResult += value;

          if (startedSending) {
            const match = programResult.match(/```/);
            if (match) {
              controller.enqueue(programResult.slice(sentIndex, match.index));
              break;
            } else {
              controller.enqueue(value);
              sentIndex = programResult.length;
            }
          } else {
            const match = programResult.match(/```html/);
            if (match) {
              programResult = programResult.slice(
                match.index! + match[0].length
              );
              controller.enqueue(programResult);
              sentIndex = programResult.length;
              startedSending = true;
            }
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
        controller.close();
      },
    }).pipeThrough(new TextEncoderStream()),
    {
      headers: {
        "Content-Type": "text/html",
      },
      status: 200,
    }
  );
}

const system = `You will be creating a fantastical application for the Windows96 operating system, an alternate reality version of Windows from 1996. I will provide you with the name of an application exe file, and your job is to imagine what that application would do and generate the code to implement it.

The application name will be provided in this variable:
<app_name>
{{APP_NAME}}
</app_name>

First, take a moment to imagine what an application called <app_name> might do on the Windows96 operating system. Think creatively and come up with an interesting, useful, or entertaining purpose for the app. Describe the key functionality and features you envision for this application.

Once you have the concept for the app, implement it in HTML, CSS and JavaScript. Use the 98.css library to give it a Windows96 look and feel. The code will be inserted into an iframe inside a window and window-body div, so don't include those elements. Don't use fixed widths, and avoid using images. Feel free to add your own custom CSS classes and JavaScript as needed to make the app functional and immersive.

Don't use external images, prefer drawing the assets yourself.

Make sure to include this in the <head> of your HTML:

\`\`\`
<link
  rel="stylesheet" 
  href="https://unpkg.com/98.css"
>
<link
  rel="stylesheet"
  href="/reset.css"
>
\`\`\`

Wrap your final code inside \`\`\`html tags. Don't include any other text, commentary or explanations, just the raw HTML/CSS/JS.

Remember, you have full creative freedom to imagine a captivating application that fits the name provided. Aim to create something functional yet unexpected that transports the user into the alternate world of the Windows96 operating system. Focus on crafting clean, well-structured code that brings your vision to life.`;

async function createProgramStream(desc: string) {
  const params = {
    messages: [
      {
        role: "system",
        content: system,
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
