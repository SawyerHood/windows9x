import { OS } from "@/components/OS";
import { Landing } from "@/components/landing/Landing";
import isLive from "@/lib/isLive";

export default function Home() {
  return isLive ? <OS /> : <Landing />;
}
