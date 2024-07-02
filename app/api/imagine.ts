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
  const negativePrompt = url.searchParams.get('negative_prompt');
  const width = url.searchParams.get('width');
  const height = url.searchParams.get('height');
  const steps = url.searchParams.get('steps');
  const seed = url.searchParams.get('seed');
  const model = url.searchParams.get('model');

  const { client } = createClientFromSettings(settings);

  const response = await client.request({
    url: '/v1/imagine',
    method: 'GET',
    params: {
      prompt,
      negative_prompt: negativePrompt,
      width,
      height,
      steps,
      seed,
      model
    }
  });

  return new Response(JSON.stringify(response.data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
