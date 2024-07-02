import { getDefaultClient } from "@/ai/client";

export async function GET() {
  const client = getDefaultClient();
  const response = await client.request({
    url: '/v1/models',
    method: 'GET',
  });

  return new Response(JSON.stringify(response.data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
