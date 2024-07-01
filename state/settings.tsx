import { atomWithStorage } from "jotai/utils";

export type Settings = {
  apiKey: string | null;
};

export const settingsAtom = atomWithStorage<Settings>("settings", {
  apiKey: null,
});
