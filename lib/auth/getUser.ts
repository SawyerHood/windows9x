import { User } from "@supabase/supabase-js";
import { createClient } from "../supabase/server";
import { isLocal } from "../isLocal";

export async function getUser(): Promise<User | null> {
  if (isLocal()) {
    return null;
  }
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
