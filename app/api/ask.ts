import { createClientFromSettings } from "@/ai/client";
import { getSettingsFromJSON } from "@/lib/getSettingsFromRequest";
import { getUser } from "@/lib/auth/getUser";
import isLive from "@/lib/isLive";

export async function GET(req: Request) {
  if (!isLive) {
    return new Response(JSON.stringify({ error: "Not live" }), { status: 400 });
  }

  const user = await getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const url = new URL(req.url);
  const settings = await getSettingsFromJSON(req);

  const prompt = url.searchParams.get('prompt');

  const { client } = createClientFromSettings(settings);

  const response = await client.request({
    url: '/v1/ask',
    method: 'GET',
    params: {
      prompt
    }
  });

  return new Response(JSON.stringify(response.data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
