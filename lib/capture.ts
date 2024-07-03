import { createClient } from "@/lib/supabase/server";
import posthog from "posthog-js";

type Event = {
  type: "chat" | "icon" | "name" | "program";
  usedOwnKey: boolean;
};

export async function capture(event: Event) {
  const supabase = createClient();
  const user = await supabase.auth.getUser();
  const { type, ...props } = event;
  posthog.capture(type, {
    ...props,
    userId: user.data.user?.id ?? null,
  });
}
