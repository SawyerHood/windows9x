import { config } from "./config";

export type Flags = {
  [key in keyof typeof config]: boolean;
};

export function getFlagsForUser(user: { email?: string } | null): Flags {
  const flags: { [key: string]: boolean } = {};

  for (const [key, value] of Object.entries(config)) {
    flags[key] =
      value.allowed?.includes(user?.email ?? "") ?? value.enabled ?? false;
  }

  return flags as { [key in keyof typeof config]: boolean };
}

export const DEFAULT_FLAGS = getFlagsForUser({});
