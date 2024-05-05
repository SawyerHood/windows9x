"use client";

import styles from "./OS.module.css";
import cx from "classnames";
import { assertNever } from "@/utils/assertNever";
import { atomFamily, atomWithReducer } from "jotai/utils";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";

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
      <button onClick={() => dispatch({ type: "ADD" })}>Add Window</button>
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
      {id}
    </button>
  );
}

function Window({ id }: { id: string }) {
  const [state, dispatch] = useAtom(windowAtomFamily(id));
  const windowsDispatch = useSetAtom(windowsListAtom);
  const [focusedWindow, setFocusedWindow] = useAtom(focusedWindowAtom);

  return (
    <div
      className={cx("window")}
      id={id}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: state.status === "maximized" ? "100%" : 400,
        height: state.status === "maximized" ? "100%" : undefined,
        transform:
          state.status === "maximized"
            ? "none"
            : `translate(${state.pos.x}px, ${state.pos.y}px)`,
        display: state.status === "minimized" ? "none" : "block",
      }}
    >
      <div
        className={cx("title-bar", {
          inactive: focusedWindow !== id,
        })}
        onMouseDown={(e) => {
          const handleMouseMove = (e: MouseEvent) => {
            dispatch({
              type: "MOVE",
              payload: { dx: e.movementX, dy: e.movementY },
            });
          };

          window.addEventListener("mousemove", handleMouseMove);

          const handleMouseUp = () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
          };

          window.addEventListener("mouseup", handleMouseUp);
        }}
      >
        <div className="title-bar-text">Welcome to 98.css</div>
        <div className="title-bar-controls">
          <button
            aria-label="Minimize"
            onClick={() => {
              dispatch({ type: "TOGGLE_MINIMIZE" });
              if (focusedWindow === id) {
                setFocusedWindow(null);
              }
            }}
          ></button>
          <button
            aria-label={state.status === "maximized" ? "Restore" : "Maximize"}
            onClick={() => dispatch({ type: "TOGGLE_MAXIMIZE" })}
          ></button>
          <button
            aria-label="Close"
            onClick={() => windowsDispatch({ type: "REMOVE", payload: id })}
          ></button>
        </div>
      </div>
      <div className="window-body">
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat.
        </p>
      </div>
    </div>
  );
}

type WindowState = {
  status: "maximized" | "minimized" | "normal";
  pos: {
    x: number;
    y: number;
  };
};

type WindowAction =
  | { type: "TOGGLE_MAXIMIZE" }
  | { type: "TOGGLE_MINIMIZE" }
  | { type: "RESTORE" }
  | { type: "MOVE"; payload: { dx: number; dy: number } };

function windowReducer(state: WindowState, action: WindowAction): WindowState {
  switch (action.type) {
    case "TOGGLE_MAXIMIZE":
      return {
        ...state,
        status: state.status === "maximized" ? "normal" : "maximized",
      };
    case "TOGGLE_MINIMIZE":
      return {
        ...state,
        status: state.status === "minimized" ? "normal" : "minimized",
      };
    case "MOVE":
      if (state.status === "maximized" || state.status === "minimized") {
        return state;
      }
      return {
        ...state,
        pos: {
          x: state.pos.x + action.payload.dx,
          y: state.pos.y + action.payload.dy,
        },
      };
    case "RESTORE":
      return { ...state, status: "normal" };
    default:
      assertNever(action);
  }

  return state;
}

type WindowsListState = string[];

type WindowsListAction = { type: "ADD" } | { type: "REMOVE"; payload: string };

const windowsListAtom = atomWithReducer(
  ["window1"],
  (state: WindowsListState, action: WindowsListAction): WindowsListState => {
    switch (action.type) {
      case "ADD":
        return [...state, generateRandomId()];
      case "REMOVE":
        return state.filter((id) => id !== action.payload);
      default:
        assertNever(action);
    }
    return state;
  }
);

const windowAtomFamily = atomFamily((id: string) => {
  return atomWithReducer(
    {
      status: "normal",
      pos: { x: 100, y: 100 },
    },
    windowReducer
  );
});

const focusedWindowAtom = atom<string | null>(null);

function generateRandomId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}
