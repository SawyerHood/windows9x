"use client";

import { getDefaultStore } from "jotai";
import { focusedWindowAtom } from "../state/focusedWindowAtom";
import { windowsListAtom } from "@/state/windowsList";
import { WindowState, windowAtomFamily } from "@/state/window";

export function createWindow({
  title,
  program,
}: {
  title: string;
  program: WindowState["program"];
}) {
  const id = generateRandomId();
  getDefaultStore().set(windowAtomFamily(id), {
    type: "INIT",
    payload: { title, program, id },
  });
  getDefaultStore().set(windowsListAtom, { type: "ADD", payload: id });
  getDefaultStore().set(focusedWindowAtom, id);
}

function generateRandomId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}
