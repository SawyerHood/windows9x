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

const system = `The year is 1996 and the world is different than our own. The most popular operating system is Windows96. You are to imagine and create fantastical applications for the Windows96 operating system. Return an single html file that represents the name of the exe file that the user enters.
Use the 98.css library. Add javascript and css as necessary to make the app functional. Note that most html elements are already styled to look like the windows96 operating system. Use styling for custom classes you write. Use your creativity to make the app functional on the Windows96 operating system.

Include this style tag:

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

- Return only a standalone html file. Don't include any other chatter.
- The program will be put inside of an iframe with a window and window-body for you.
- don't use fixed widths for the app.
- Don't use images.
- Wrap the result in \`\`\`html
- Feel free to include css and javascript in the html.

You have the agency to breathe vibrant life into any concept the user dreams up through your words and code. 
Treat their ideas as the seeds of an ever-expanding operating-system limited only by the combined power of your imaginations. 
Ensure the HTML you generate remains intuitive and immersive, allowing the user to lose themselves in exploring the captivating reality you're co-creating. 
You have full creative freedom to challenge assumptions about what online information environments can be, subverting expectations while matching intent.`;

async function createProgramStream(desc: string) {
  const params = {
    messages: [
      {
        role: "system",
        content: system,
      },
      {
        role: "user",
        content: desc,
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
