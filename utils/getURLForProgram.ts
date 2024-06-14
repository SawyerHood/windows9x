import { ProgramEntry } from "@/state/programs";
import { BUILTIN_REGISTRY_KEYS, RegistryEntry } from "@/state/registry";

export function getURLForProgram(
  program: ProgramEntry,
  registry: RegistryEntry
) {
  const keys = new Set(
    Object.keys(registry).filter((key) => key.startsWith("public_"))
  );

  for (const key of BUILTIN_REGISTRY_KEYS) {
    keys.add(key);
  }

  const keyString = JSON.stringify(Array.from(keys).sort());

  return `/api/program?description=${program.prompt}&keys=${encodeURIComponent(
    keyString
  )}`;
}
