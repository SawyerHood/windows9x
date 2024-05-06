"use client";

import styles from "./OS.module.css";
import cx from "classnames";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { focusedWindowAtom } from "@/state/focusedWindowAtom";
import { windowsListAtom } from "@/state/windowsList";
import { windowAtomFamily } from "@/state/window";
import { createWindow } from "@/utils/createWindow";
import { Window } from "./Window";

export function OS() {
  const [windows, dispatch] = useAtom(windowsListAtom);
  const setFocusedWindow = useSetAtom(focusedWindowAtom);
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const windowID = windows.find((windowId) => {
        const windowElement = document.getElementById(windowId);
        return windowElement && windowElement.contains(target);
      });
      if (windowID) {
        setFocusedWindow(windowID);
      } else {
        setFocusedWindow(null);
      }
    };
    window.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, [windows, setFocusedWindow]);
  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        position: "relative",
        backgroundImage: "url(/bg.jpg)",
        backgroundSize: "cover",
      }}
    >
      {windows.map((id) => (
        <Window key={id} id={id} />
      ))}
      <button
        onClick={() => {
          createWindow({
            title: "Welcome to Windows 96",
            program: { type: "welcome" },
          });
        }}
      >
        Add Welcome
      </button>
      <button
        onClick={() => {
          createWindow({
            title: "Run",
            program: { type: "run" },
          });
        }}
      >
        Add Run
      </button>
      <TaskBar />
    </div>
  );
}

function TaskBar() {
  const windows = useAtomValue(windowsListAtom);
  return (
    <div className={cx("window", styles.taskbar)}>
      <button className={styles.startButton}>Start</button>
      <div className={styles.divider}></div>
      {windows.map((id) => (
        <WindowTaskBar key={id} id={id} />
      ))}
    </div>
  );
}

function WindowTaskBar({ id }: { id: string }) {
  const [focusedWindow, setFocusedWindow] = useAtom(focusedWindowAtom);
  const [state, dispatch] = useAtom(windowAtomFamily(id));
  return (
    <button
      key={id}
      className={cx(styles.windowButton, {
        [styles.active]: focusedWindow === id,
      })}
      onClick={(e) => {
        e.stopPropagation();
        setFocusedWindow(id);
        if (state.status === "minimized") {
          dispatch({ type: "RESTORE" });
        }
      }}
    >
      {state.title}
    </button>
  );
}
