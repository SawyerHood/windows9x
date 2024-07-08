import { User } from "@supabase/supabase-js";
import { Client } from "../supabase/server";

export async function insertGeneration({
  client,
  user,
  tokensUsed,
  action,
}: {
  client: Client;
  user: User;
  tokensUsed: number;
  action: string;
}) {
  await client
    .from("usage_logs")
    .insert({
      user_id: user.id,
      tokens_used: tokensUsed,
      action: action,
    })
    .single();
}
