import { createClient } from "@/lib/supabase/server";
import { PostHog } from "posthog-node";
import { isLocal } from "./isLocal";

type Event = {
  type: "chat" | "icon" | "name" | "program" | "help";
  usedOwnKey: boolean;
};

export async function capture(event: Event, req: Request) {
  if (isLocal()) {
    return;
  }

  const supabase = createClient();
  const user = await supabase.auth.getUser();
  const { type, ...props } = event;
  const posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
  });

  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const country = req.headers.get("X-Vercel-IP-Country") || "unknown";

  posthog.capture({
    event: type,
    properties: {
      ...props,
      ip,
      country,
    },
    distinctId: user.data.user?.id ?? "null",
  });
  await posthog.shutdown();
}
