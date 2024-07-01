import { settingsAtom } from "@/state/settings";
import { getDefaultStore } from "jotai";

export function getSettings() {
  const store = getDefaultStore();
  const settings = store.get(settingsAtom);
  return settings;
}
