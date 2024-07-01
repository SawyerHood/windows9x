"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function login() {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?source=login`,
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
  console.log("logout");
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
