"use client";

import { getDefaultStore } from "jotai";
import { focusedWindowAtom } from "../state/focusedWindow";
import { windowsListAtom } from "@/state/windowsList";
import { MIN_WINDOW_SIZE, WindowState, windowAtomFamily } from "@/state/window";
import { isMobile } from "./isMobile";
import { waitForElement } from "./waitForElement";

export function createWindow({
  title,
  program,
  loading = false,
  size = { ...MIN_WINDOW_SIZE, height: "auto" },
  pos,
  icon,
}: {
  title: string;
  program: WindowState["program"];
  loading?: boolean;
  size?: WindowState["size"];
  pos?: WindowState["pos"];
  icon?: string;
}): string {
  const id = generateRandomId();
  const isCentering = !pos;
  pos = pos || {
    x: Math.max(0, Math.floor(window.innerWidth / 2 - size.width / 2)),
    y: Math.max(
      0,
      Math.floor(
        window.innerHeight / 2 -
          (size.height === "auto" ? MIN_WINDOW_SIZE.height : size.height) / 2
      )
    ),
  };
  getDefaultStore().set(windowAtomFamily(id), {
    type: "INIT",
    payload: {
      title,
      program,
      id,
      loading,
      size,
      pos,
      icon,
      status: isMobile() ? "maximized" : "normal",
    },
  });
  getDefaultStore().set(windowsListAtom, { type: "ADD", payload: id });
  getDefaultStore().set(focusedWindowAtom, id);

  if (isCentering && size.height === "auto") {
    waitForElement(id).then((element) => {
      if (element) {
        const windowHeight = window.innerHeight;
        const elementHeight = element.offsetHeight;
        const newY = Math.max(
          0,
          Math.floor(windowHeight / 2 - elementHeight / 2)
        );
        getDefaultStore().set(windowAtomFamily(id), {
          type: "MOVE",
          payload: { dx: 0, dy: newY - pos.y },
        });
      }
    });
  }
  return id;
}

function generateRandomId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}
