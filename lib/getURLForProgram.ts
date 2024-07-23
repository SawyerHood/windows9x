import { ProgramEntry } from "@/state/programs";
import { RegistryEntry } from "@/state/registry";
import { getRegistryKeys } from "./getRegistryKeys";
import { getSettings } from "./getSettings";

export function getURLForProgram(
  program: ProgramEntry,
  registry: RegistryEntry
) {
  const keys = getRegistryKeys(registry);
  const keyString = JSON.stringify(keys);
  const imgUrlParam = program.imgPrompt
    ? `&imgUrl=${encodeURIComponent(program.imgPrompt)}`
    : "";

  return `/api/program?description=${encodeURIComponent(
    program.prompt
  )}&keys=${encodeURIComponent(keyString)}&settings=${encodeURIComponent(
    JSON.stringify(getSettings())
  )}${imgUrlParam}`;
}
