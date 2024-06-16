import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { fileSystemAtom } from "./filesystem";
import { REGISTRY_PATH } from "@/lib/filesystem/defaultFileSystem";

export interface RegistryEntry {
  [key: string]: any;
}

export const registryAtom = atom(
  (get) => {
    const filesystem = get(fileSystemAtom);
    const registry = filesystem.readFile(REGISTRY_PATH);
    return JSON.parse(registry);
  },
  (get, set, update: RegistryEntry) => {
    const filesystem = get(fileSystemAtom);
    const registry = filesystem.updateFile(
      REGISTRY_PATH,
      JSON.stringify(update)
    );
    set(fileSystemAtom, registry);
  }
);

export const DESKTOP_URL_KEY = "public_desktop_url";

export const BUILTIN_REGISTRY_KEYS = [DESKTOP_URL_KEY];
