import { BUILTIN_REGISTRY_KEYS, RegistryEntry } from "@/state/registry";

export function getRegistryKeys(registry: RegistryEntry): string[] {
  const keys = new Set(
    Object.keys(registry).filter((key) => key.startsWith("public_"))
  );

  for (const key of BUILTIN_REGISTRY_KEYS) {
    keys.add(key);
  }

  return Array.from(keys).sort();
}
