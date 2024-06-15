import { ProgramEntry } from "@/state/programs";
import { RegistryEntry } from "@/state/registry";
import { getRegistryKeys } from "./getRegistryKeys";

export function getURLForProgram(
  program: ProgramEntry,
  registry: RegistryEntry
) {
  const keys = getRegistryKeys(registry);
  const keyString = JSON.stringify(keys);

  return `/api/program?description=${program.prompt}&keys=${encodeURIComponent(
    keyString
  )}`;
}
