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

const system = `You are an expert web developer. Create a standalone html file that implements the application that the user specifies.

Use tailwind from a cdn.

Make it functional and mock data / api calls if you need to. Use lorem picsum for images.

The application name will be provided in this variable:
<app_name>
{{APP_NAME}}
</app_name>

Wrap the html in \`\`\`html tags. Don't include any other text, commentary or explanations, just the raw HTML/CSS/JS.
`;

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
