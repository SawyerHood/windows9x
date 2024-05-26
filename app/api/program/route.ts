import { CHEAP_MODEL, MODEL, openai } from "@/ai/client";
import { ChatCompletionCreateParamsStreaming } from "openai/resources/index.mjs";
import { streamHtml } from "openai-html-stream";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const desc = url.searchParams.get("description");
  if (!desc) {
    return new Response("No description", {
      status: 404,
    });
  }

  const programStream = await createProgramStream(desc);
  return new Response(streamHtml(programStream), {
    headers: {
      "Content-Type": "text/html",
    },
    status: 200,
  });
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
