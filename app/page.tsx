import { OS } from "@/components/OS";
import { Landing } from "@/components/landing/Landing";
import { FlagsProvider } from "@/flags/context";
import { getFlagsForUser } from "@/flags/flags";
import { ActionsProvider } from "@/lib/actions/ActionsProvider";
import { login, logout } from "@/lib/auth/actions";
import { getUser } from "@/lib/auth/getUser";
import { isLocal } from "@/lib/isLocal";

export default async function Home() {
  const user = await getUser();

  return (
    <FlagsProvider flags={getFlagsForUser(user)}>
      <ActionsProvider actions={{ login, logout }}>
        {user || isLocal() ? <OS /> : <Landing />}
      </ActionsProvider>
    </FlagsProvider>
  );
}
