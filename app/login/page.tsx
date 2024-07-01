import { login } from "./actions";

export default function LoginPage() {
  return (
    <form>
      <button formAction={login}>Log in</button>
    </form>
  );
}
