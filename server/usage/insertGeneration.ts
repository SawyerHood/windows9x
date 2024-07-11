import { User } from "@supabase/supabase-js";
import { Client } from "@/lib/supabase/server";
import { getFlagsForUser } from "@/flags/flags";

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
  const flags = getFlagsForUser(user);
  if (!flags.tokens) {
    return;
  }
  await client
    .from("generations")
    .insert({
      user_id: user.id,
      tokens_used: tokensUsed,
      action: action,
    })
    .single();
}
