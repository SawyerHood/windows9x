import { OS } from "@/components/OS";
import { Landing } from "@/components/landing/Landing";
import { ActionsProvider } from "@/lib/actions/ActionsProvider";
import isLive from "@/lib/isLive";
import { login, logout } from "@/lib/auth/actions";
import { getUser } from "@/lib/auth/getUser";

export default async function Home() {
  const user = await getUser();

  return (
    <ActionsProvider actions={{ login, logout }}>
      {isLive && user ? <OS /> : <Landing />}
    </ActionsProvider>
  );
}
