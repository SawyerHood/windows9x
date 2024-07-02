import { createClientFromSettings } from "@/ai/client";
import { getSettingsFromJSON } from "@/lib/getSettingsFromRequest";
import { getUser } from "@/lib/auth/getUser";
import isLive from "@/lib/isLive";

export async function POST(req: Request) {
  if (!isLive) {
    return new Response(JSON.stringify({ error: "Not live" }), { status: 400 });
  }

  const user = await getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const body = await req.json();
  const settings = await getSettingsFromJSON(req);

  const { client } = createClientFromSettings(settings);

  const response = await client.request({
    url: '/v1/images/generations',
    method: 'POST',
    data: {
      prompt: body.prompt,
      model: body.model,
      n: body.n,
      quality: body.quality,
      response_format: body.response_format,
      size: body.size
    }
  });

  return new Response(JSON.stringify(response.data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
