import { User } from "@supabase/supabase-js";

import { Client } from "@/lib/supabase/server";
import { getTokens } from "./getTokens";

export async function canGenerate(client: Client, user: User) {
  const { tokens } = await getTokens(client, user);
  return tokens > 0;
}
