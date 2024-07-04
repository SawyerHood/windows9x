"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function login() {
  const supabase = createClient();

  const url = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?source=login`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: url,
    },
  });

  if (error) {
    redirect("/error");
  }

  revalidatePath("/", "layout");

  if (data.url) {
    redirect(data.url); // use the redirect API for your server framework
  }
}

export async function logout() {
  const supabase = createClient();

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
