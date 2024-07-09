import { WIDTH } from "@/components/programs/Welcome";
import { createWindow } from "./createWindow";

let initialized = false;

export function initState() {
  if (initialized) return;
  initialized = true;
  const welcomeID = createWindow({
    title: "Welcome",
    program: { type: "welcome" },
    pos: {
      x: window.innerWidth / 2 - WIDTH / 2,
      y: 10,
    },
    size: { width: WIDTH, height: "auto" },
  });
  waitForElement(welcomeID)
    .then((welcomeWindow) => {
      if (!welcomeWindow) return;
      const welcomeRect = welcomeWindow.getBoundingClientRect();
      createWindow({
        title: "Run",
        program: { type: "run" },
        pos: {
          x: window.innerWidth / 2 - 200 / 2,
          y: welcomeRect.bottom + 10,
        },
        size: { width: 200, height: "auto" },
      });
    })
    .catch((error) => {
      console.error("Failed to create Run window:", error);
    });
}

async function waitForElement(id: string, timeout = 5000) {
  return new Promise<HTMLElement | null>((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const element = document.getElementById(id);
      if (element) {
        clearInterval(interval);
        resolve(element);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        reject(new Error(`Timeout waiting for element with id: ${id}`));
      }
    }, 100);
  });
}
