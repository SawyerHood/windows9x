import { WIDTH } from "@/components/programs/Welcome";
import { createWindow } from "./createWindow";
import { isMobile } from "./isMobile";
import { waitForElement } from "./waitForElement";

let initialized = false;

export function initState() {
  if (initialized) return;
  initialized = true;
  const id = createWindow({
    title: "Welcome",
    program: { type: "welcome" },

    size: { width: WIDTH, height: "auto" },
  });
  if (!isMobile()) {
    waitForElement(id).then((el) => {
      if (el) {
        const welcomeRect = el.getBoundingClientRect();
        const runWidth = 200;
        const runLeft = welcomeRect.left - 100; // Overlap by 50 pixels
        const runTop = welcomeRect.top + 200; // Offset slightly from the top of Welcome

        createWindow({
          title: "Run",
          program: { type: "run" },
          size: { width: runWidth, height: "auto" },
          pos: { x: runLeft, y: runTop },
        });
      }
    });
  }
}
