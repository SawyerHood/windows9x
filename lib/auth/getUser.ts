import { User } from "@supabase/supabase-js";
import { createClient } from "../supabase/server";

export async function getUser(): Promise<User | null> {
  if (process.env.LOCAL_MODE) {
    return null;
  }
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
