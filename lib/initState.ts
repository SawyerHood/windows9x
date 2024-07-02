import { createWindow } from "./createWindow";

let initialized = false;

export function initState() {
  if (initialized) return;
  initialized = true;
  createWindow({
    title: "Run",
    program: { type: "run" },
    pos: { x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 150 },
    size: { width: 400, height: "auto" },
  });
}
