import { atomWithStorage } from "jotai/utils";

interface RegistryEntry {
  [key: string]: any;
}

export const registryAtom = atomWithStorage<RegistryEntry>("registry", {});

export const DESKTOP_URL_KEY = "public_desktop_url";

export const BUILTIN_REGISTRY_KEYS = [DESKTOP_URL_KEY];
