import { Settings } from "@/state/settings";
import { createClientFromSettings } from "./client";

export function getMaxTokens(settings: Settings) {
  const { mode } = createClientFromSettings(settings);
  if (mode !== "openai" && settings.model === "best") {
    return 8192;
  }

  return 4000;
}
