"use client";

import styles from "./OS.module.css";
import cx from "classnames";
import { getDefaultStore, useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { focusedWindowAtom } from "@/state/focusedWindow";
import { windowsListAtom } from "@/state/windowsList";
import { windowAtomFamily } from "@/state/window";
import { createWindow } from "@/lib/createWindow";
import { Window } from "./Window";
import { startMenuOpenAtom } from "@/state/startMenu";
import { Desktop } from "./Desktop";
import { DESKTOP_URL_KEY, registryAtom } from "@/state/registry";
import { ContextMenu } from "./ContextMenu";

// Import the XP theme CSS file conditionally based on the current theme state
import dynamic from "next/dynamic";

const XPTheme = dynamic(() => import("../app/xp-theme.css"), {
  ssr: false,
});

export function OS() {
  const [windows] = useAtom(windowsListAtom);
  const setFocusedWindow = useSetAtom(focusedWindowAtom);
  const registry = useAtomValue(registryAtom);
  const [theme, setTheme] = useState("Windows9X"); // State variable to hold the current theme

  const publicDesktopUrl = registry[DESKTOP_URL_KEY] ?? "/bg.jpg";

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      getDefaultStore().set(startMenuOpenAtom, false);
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

  // Conditionally apply the XP theme based on the current theme state
  useEffect(() => {
    if (theme === "XP") {
      XPTheme;
    }
  }, [theme]);

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        position: "relative",
        backgroundImage: `url(${publicDesktopUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        overflow: "hidden",
      }}
      onContextMenu={(e) => {
        e.preventDefault();
      }}
    >
      <Desktop />
      {windows.map((id) => (
        <Window key={id} id={id} />
      ))}

      <TaskBar theme={theme} setTheme={setTheme} />
      <ContextMenu />
    </div>
  );
}

function TaskBar({ theme, setTheme }) {
  const windows = useAtomValue(windowsListAtom);
  const [startMenuOpen, setStartMenuOpen] = useAtom(startMenuOpenAtom);
  return (
    <div className={cx("window", styles.taskbar)}>
      <button
        className={styles.startButton}
        onClick={() => setStartMenuOpen((v) => !v)}
      >
        Start
      </button>
      {startMenuOpen && <StartMenu />}
      <div className={styles.divider}></div>
      {windows.map((id) => (
        <WindowTaskBarItem key={id} id={id} />
      ))}
      <button
        className={styles.themeSwitcher}
        onClick={() => setTheme(theme === "Windows9X" ? "XP" : "Windows9X")}
      >
        {theme === "Windows9X" ? "Switch to XP" : "Switch to 9X"}
      </button>
    </div>
  );
}

function StartMenu() {
  return (
    <div className={cx("window", styles.startMenu)}>
      <button
        onMouseDown={() => {
          createWindow({
            title: "Welcome to Windows 9X",
            program: { type: "welcome" },
          });
        }}
      >
        Welcome
      </button>
      <button
        onMouseDown={() => {
          createWindow({
            title: "Run",
            program: { type: "run" },
          });
        }}
      >
        Run
      </button>
      <button
        onMouseDown={() => {
          createWindow({
            title: "Explorer",
            program: { type: "explorer" },
          });
        }}
      >
        Explorer
      </button>
    </div>
  );
}

function WindowTaskBarItem({ id }: { id: string }) {
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
      style={{
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: "256px",
      }}
    >
      {state.title}
    </button>
  );
}
