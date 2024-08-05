import { showUpsell } from "./showUpsell";

export async function wrappedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  try {
    const response = await fetch(input, init);
    if (!response.ok && response.status === 402) {
      showUpsell();
    }
    return response;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}

export default wrappedFetch;
