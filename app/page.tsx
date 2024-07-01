import { OS } from "@/components/OS";
import { Landing } from "@/components/landing/Landing";
import { ActionsProvider } from "@/lib/actions/ActionsProvider";
import isLive from "@/lib/isLive";
import { login, logout } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log(user);

  return (
    <ActionsProvider actions={{ login, logout }}>
      {isLive && user ? <OS /> : <Landing />}
    </ActionsProvider>
  );
}
