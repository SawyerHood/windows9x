import { User } from "@supabase/supabase-js";
import { Client } from "../../lib/supabase/server";

export async function getTokens(client: Client, user: User) {
  const token = await client
    .from("tokens")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return {
    tokens: (token.data?.free_amount ?? 0) + (token.data?.paid_amount ?? 0),
  };
}
