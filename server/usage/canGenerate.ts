import { User } from "@supabase/supabase-js";

import { Client } from "@/lib/supabase/server";
import { getTokens } from "./getTokens";
import { getFlagsForUser } from "@/flags/flags";

export async function canGenerate(client: Client, user: User) {
  const flags = getFlagsForUser(user);
  if (!flags.tokens) {
    return true;
  }
  const { tokens } = await getTokens(client, user);
  return tokens > 0;
}
