import { MODEL, openai } from "@/ai/client";
import isLive from "@/lib/isLive";

export async function POST(req: Request) {
  if (!isLive) {
    return new Response(JSON.stringify({ error: "Not live" }), { status: 400 });
  }

  const { messages, returnJson } = await req.json();

  console.log(messages);

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [...messages],
    max_tokens: 4000,
    response_format: returnJson ? { type: "json_object" } : { type: "text" },
  });

  console.log(response);

  const content = response.choices[0].message.content;

  console.log(content);

  return new Response(JSON.stringify(content), { status: 200 });
}
