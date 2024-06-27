import { atomWithStorage } from "jotai/utils";

type Settings = {
  apiKey: string | null;
};

export const settingsAtom = atomWithStorage<Settings>("settings", {
  apiKey: null,
});
