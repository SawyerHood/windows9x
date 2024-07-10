import { createClient } from "@/lib/supabase/server";
import { publicProcedure, router } from "./trpc";
import { getUser } from "@/lib/auth/getUser";
import { TRPCError } from "@trpc/server";
import { getTokens } from "./usage/getTokens";

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
    return await getTokens(client, user);
  }),
});

export type AppRouter = typeof appRouter;
