import { WIDTH } from "@/components/programs/Welcome";
import { createWindow } from "./createWindow";

let initialized = false;

export function initState() {
  if (initialized) return;
  initialized = true;
  createWindow({
    title: "Welcome",
    program: { type: "welcome" },
    pos: {
      x: window.innerWidth / 2 - WIDTH / 2,
      y: 100,
    },
    size: { width: WIDTH, height: "auto" },
  });
}
