"use client";

import { getDefaultStore } from "jotai";
import { focusedWindowAtom } from "../state/focusedWindow";
import { windowsListAtom } from "@/state/windowsList";
import { MIN_WINDOW_SIZE, WindowState, windowAtomFamily } from "@/state/window";

export function createWindow({
  title,
  program,
  loading = false,
  size = { ...MIN_WINDOW_SIZE, height: "auto" },
  pos = { x: 200, y: 200 },
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
  getDefaultStore().set(windowAtomFamily(id), {
    type: "INIT",
    payload: { title, program, id, loading, size, pos, icon },
  });
  getDefaultStore().set(windowsListAtom, { type: "ADD", payload: id });
  getDefaultStore().set(focusedWindowAtom, id);
  return id;
}

function generateRandomId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}
