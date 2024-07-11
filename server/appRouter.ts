import { createClient } from "@/lib/supabase/server";
import { publicProcedure, router } from "./trpc";
import { getUser } from "@/lib/auth/getUser";
import { TRPCError } from "@trpc/server";
import { getTokens } from "./usage/getTokens";
import { isLocal } from "@/lib/isLocal";

export const appRouter = router({
  getTokens: publicProcedure.query(async () => {
    if (isLocal()) {
      return {
        tokens: 1000,
      };
    }
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
