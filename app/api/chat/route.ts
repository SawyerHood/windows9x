import { MODEL, openai } from "@/ai/client";

export async function POST(req: Request) {
  const { messages } = await req.json();

  console.log(messages);

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [...messages],
    max_tokens: 4000,
  });

  console.log(response);

  const content = response.choices[0].message.content;

  console.log(content);

  return new Response(JSON.stringify(content), { status: 200 });
}
