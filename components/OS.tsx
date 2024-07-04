"use client";

import styles from "./OS.module.css";
import cx from "classnames";
import { getDefaultStore, useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { focusedWindowAtom } from "@/state/focusedWindow";
import { windowsListAtom } from "@/state/windowsList";
import { windowAtomFamily } from "@/state/window";
import { createWindow } from "@/lib/createWindow";
import { Window } from "./Window";
import { startMenuOpenAtom } from "@/state/startMenu";
import { Desktop } from "./Desktop";
import { DESKTOP_URL_KEY, registryAtom } from "@/state/registry";
import { ContextMenu } from "./ContextMenu";
import { useActions } from "@/lib/actions/ActionsProvider";
import Image from "next/image";
import { initState } from "@/lib/initState";
import { WIDTH } from "./programs/Welcome";

export function OS() {
  const [windows] = useAtom(windowsListAtom);
  const setFocusedWindow = useSetAtom(focusedWindowAtom);
  const registry = useAtomValue(registryAtom);

  const publicDesktopUrl = registry[DESKTOP_URL_KEY] ?? "/bg.jpg";

  useEffect(() => {
    const onMouseDown = (e: MouseEvent | TouchEvent) => {
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
    window.addEventListener("touchstart", onMouseDown); // Add touch event listener for moving windows
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("touchstart", onMouseDown); // Remove touch event listener for moving windows
    };
  }, [windows, setFocusedWindow]);

  useEffect(() => {
    initState();
  }, []);

  return (
    <div
      style={{
        height: "100dvh",
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

      <TaskBar />
      <ContextMenu />
    </div>
  );
}

function TaskBar() {
  const windows = useAtomValue(windowsListAtom);
  const [startMenuOpen, setStartMenuOpen] = useAtom(startMenuOpenAtom);
  return (
    <div className={cx("window", styles.taskbar)}>
      <button
        className={styles.startButton}
        onMouseDown={(e) => {
          e.stopPropagation();
          setStartMenuOpen((v) => !v);
        }}
      >
        Start
      </button>
      {startMenuOpen && <StartMenu />}
      <div className={styles.divider}></div>
      {windows.map((id) => (
        <WindowTaskBarItem key={id} id={id} />
      ))}
    </div>
  );
}

function StartMenu() {
  const { logout } = useActions();

  const entries: { label: string; cb: () => void }[] = [
    {
      label: "Welcome",
      cb: () => {
        createWindow({
          title: "Welcome to Windows 9X",
          program: { type: "welcome" },
          size: { width: WIDTH, height: "auto" },
        });
      },
    },
    {
      label: "Run",
      cb: () => {
        createWindow({
          title: "Run",
          program: { type: "run" },
        });
      },
    },
    {
      label: "Explorer",
      cb: () => {
        createWindow({
          title: "Explorer",
          program: { type: "explorer" },
        });
      },
    },
    {
      label: "Settings",
      cb: () => {
        createWindow({
          title: "Settings",
          program: { type: "settings" },
        });
      },
    },
  ];

  return (
    <div className={cx("window", styles.startMenu)}>
      {entries.map((entry) => (
        <button
          key={entry.label}
          onMouseDown={entry.cb}
          onTouchStart={entry.cb}
        >
          {entry.label}
        </button>
      ))}
      <form style={{ display: "contents" }}>
        <button
          formAction={logout}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          Logout
        </button>
      </form>
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
        display: "flex",
        alignItems: "center",
        gap: "4px",
        paddingLeft: state.icon ? "8px" : undefined,
      }}
    >
      {state.icon && (
        <Image src={state.icon} alt={state.title} width={16} height={16} />
      )}
      <span>{state.title}</span>
    </button>
  );
}
