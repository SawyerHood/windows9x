import { Settings } from "@/state/settings";

// TODO check if this works
export async function getSettingsFromGetRequest(
  req: Request
): Promise<Settings> {
  const url = new URL(req.url);
  const settingsParam = url.searchParams.get("settings");
  if (settingsParam) {
    try {
      return JSON.parse(decodeURIComponent(settingsParam));
    } catch (error) {
      console.error("Error parsing settings from query string:", error);
      return { apiKey: null };
    }
  }
  return { apiKey: null };
}

export async function getSettingsFromJSON(json: any): Promise<Settings> {
  const settings = json.settings;

  if (!settings) {
    return { apiKey: null, model: "best" };
  }
  return {
    apiKey: settings.apiKey,
    model: settings.model === "cheap" ? "cheap" : "best",
  };
}
