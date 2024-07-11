import { Database } from "@/generated/supabase/types";
import { createClient } from "@supabase/supabase-js";

export const createScriptClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {}
  );
};
