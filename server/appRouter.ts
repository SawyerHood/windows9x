import { createClient } from "@/lib/supabase/server";
import { publicProcedure, router } from "./trpc";
import { getUser } from "@/lib/auth/getUser";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  getTokens: publicProcedure.query(async () => {
    const client = createClient();
    const user = await getUser();
    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      });
    }
    const token = await client
      .from("tokens")
      .select("*")
      .eq("user_id", user.id)
      .single();

    return {
      tokens: (token.data?.free_amount ?? 0) + (token.data?.paid_amount ?? 0),
    };
  }),
});

export type AppRouter = typeof appRouter;
