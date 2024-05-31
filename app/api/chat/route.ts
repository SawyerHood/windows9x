import { MODEL, openai } from "@/ai/client";

export async function POST(req: Request) {
  const { messages } = await req.json();

  console.log(messages);

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant. Respond only in plain text, not markdown.",
      },
      ...messages,
    ],
    max_tokens: 1000,
  });

  console.log(response);

  const content = response.choices[0].message.content;

  console.log(content);

  return new Response(JSON.stringify(content), { status: 200 });
}
