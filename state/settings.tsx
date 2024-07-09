import { atomWithStorage } from "jotai/utils";

export type Settings = {
  apiKey: string | null;
  model?: "cheap" | "best";
};

export const settingsAtom = atomWithStorage<Settings>("settings", {
  apiKey: null,
  model: "best",
});
