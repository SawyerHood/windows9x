"use client";

import styles from "./OS.module.css";
import cx from "classnames";
import { assertNever } from "@/utils/assertNever";
import { atomFamily, atomWithReducer } from "jotai/utils";
import {
  atom,
  getDefaultStore,
  useAtom,
  useAtomValue,
  useSetAtom,
} from "jotai";
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

function createWindow({
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
        width: state.status === "maximized" ? "100%" : state.size.width,
        height: state.status === "maximized" ? "100%" : state.size.height,
        transform:
          state.status === "maximized"
            ? "none"
            : `translate(${state.pos.x}px, ${state.pos.y}px)`,
        display: state.status === "minimized" ? "none" : "flex",
        flexDirection: "column",
        zIndex: focusedWindow === id ? 1 : 0,
        isolation: "isolate",
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
        <div className="title-bar-text">{state.title}</div>
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
      <div className="window-body" style={{ flex: 1 }}>
        <WindowBody state={state} />
      </div>
      {/* right side */}
      <div
        style={{
          top: 0,
          right: -4,
          bottom: 0,
          position: "absolute",
          width: 7,
          background: "red",
          cursor: "ew-resize",
        }}
        onMouseDown={(e) => {
          const handleMouseMove = (e: MouseEvent) => {
            dispatch({
              type: "RESIZE",
              payload: { side: "right", delta: e.movementX },
            });
          };
          const handleMouseUp = () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
          };
          window.addEventListener("mousemove", handleMouseMove);
          window.addEventListener("mouseup", handleMouseUp);
        }}
      ></div>
      {/* left side */}
      <div
        style={{
          top: 0,
          left: -4,
          bottom: 0,
          position: "absolute",
          width: 7,
          background: "red",
          cursor: "ew-resize",
        }}
        onMouseDown={(e) => {
          const handleMouseMove = (e: MouseEvent) => {
            dispatch({
              type: "RESIZE",
              payload: { side: "left", delta: e.movementX * -1 },
            });
          };
          const handleMouseUp = () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
          };
          window.addEventListener("mousemove", handleMouseMove);
          window.addEventListener("mouseup", handleMouseUp);
        }}
      ></div>
      {/* bottom side */}
      <div
        style={{
          left: 0,
          right: 0,
          bottom: -4,
          position: "absolute",
          height: 7,
          background: "red",
          cursor: "ns-resize",
        }}
        onMouseDown={(e) => {
          const handleMouseMove = (e: MouseEvent) => {
            dispatch({
              type: "RESIZE",
              payload: { side: "bottom", delta: e.movementY },
            });
          };
          const handleMouseUp = () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
          };
          window.addEventListener("mousemove", handleMouseMove);
          window.addEventListener("mouseup", handleMouseUp);
        }}
      ></div>
      {/* top side */}
      <div
        style={{
          top: -4,
          left: 0,
          right: 0,
          position: "absolute",
          height: 7,
          background: "red",
          cursor: "ns-resize",
        }}
        onMouseDown={(e) => {
          const handleMouseMove = (e: MouseEvent) => {
            dispatch({
              type: "RESIZE",
              payload: { side: "top", delta: e.movementY * -1 },
            });
          };
          const handleMouseUp = () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
          };
          window.addEventListener("mousemove", handleMouseMove);
          window.addEventListener("mouseup", handleMouseUp);
        }}
      ></div>
    </div>
  );
}

type Program =
  | { type: "welcome" }
  | { type: "run" }
  | { type: "iframe"; src: string };

type WindowState = {
  status: "maximized" | "minimized" | "normal";
  pos: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number | "auto";
  };
  title: string;
  icon?: string;
  program: Program;
  id: string;
};

type WindowAction =
  | { type: "TOGGLE_MAXIMIZE" }
  | { type: "TOGGLE_MINIMIZE" }
  | { type: "RESTORE" }
  | { type: "MOVE"; payload: { dx: number; dy: number } }
  | {
      type: "RESIZE";
      payload: { side: "top" | "bottom" | "left" | "right"; delta: number };
    }
  | {
      type: "INIT";
      payload: { title: string; program: WindowState["program"]; id: string };
    };

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
    case "INIT":
      return { ...state, ...action.payload };
    case "RESIZE":
      switch (action.payload.side) {
        case "top":
          return {
            ...state,
            size: {
              ...state.size,
              height:
                (state.size.height === "auto" ? 0 : state.size.height) +
                action.payload.delta,
            },
            pos: {
              ...state.pos,
              y: state.pos.y - action.payload.delta,
            },
          };

        case "bottom":
          return {
            ...state,
            size: {
              ...state.size,
              height:
                (state.size.height === "auto" ? 0 : state.size.height) +
                action.payload.delta,
            },
          };
        case "left":
          return {
            ...state,
            size: {
              ...state.size,
              width: state.size.width + action.payload.delta,
            },
            pos: {
              ...state.pos,
              x: state.pos.x - action.payload.delta,
            },
          };
        case "right":
          return {
            ...state,
            size: {
              ...state.size,
              width: state.size.width + action.payload.delta,
            },
          };
      }
    default:
      assertNever(action);
  }

  return state;
}

type WindowsListState = string[];

type WindowsListAction =
  | { type: "ADD"; payload: string }
  | { type: "REMOVE"; payload: string };

const windowsListAtom = atomWithReducer(
  ["window1"],
  (state: WindowsListState, action: WindowsListAction): WindowsListState => {
    switch (action.type) {
      case "ADD":
        return [...state, action.payload];
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
      size: { width: 400, height: "auto" },
      title: "Welcome to Windows 96",
      program: {
        type: "welcome",
      },
      id,
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

function WindowBody({ state }: { state: WindowState }) {
  switch (state.program.type) {
    case "welcome":
      return <Welcome id={state.id} />;
    case "run":
      return <Run id={state.id} />;
    case "iframe":
      return <Iframe id={state.id} />;
    default:
      assertNever(state.program);
  }
}

function Welcome({ id }: { id: string }) {
  return <div>Welcome to Windows 96</div>;
}

function Run({ id }: { id: string }) {
  const windowsDispatch = useSetAtom(windowsListAtom);
  return (
    <form
      style={{ display: "flex", flexDirection: "column", gap: 8 }}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const programDescription = formData.get("program-description");
        if (typeof programDescription === "string") {
          createWindow({
            title: programDescription,
            program: {
              type: "iframe",
              src: `/api/program?description=${programDescription}`,
            },
          });
          windowsDispatch({ type: "REMOVE", payload: id });
        }
      }}
    >
      <p>
        Type the description of the program you want to run and Windows will
        create it for you.
      </p>
      <div className="field-row">
        <label htmlFor="program-description">Open: </label>
        <input
          id="program-description"
          name="program-description"
          type="text"
          style={{ width: "100%" }}
          spellCheck={false}
          autoComplete="off"
        />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="submit">Open</button>
        <button
          onClick={() => windowsDispatch({ type: "REMOVE", payload: id })}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Iframe({ id }: { id: string }) {
  const [state, dispatch] = useAtom(windowAtomFamily(id));
  return (
    <iframe
      src={state.program.type === "iframe" ? state.program.src : ""}
      style={{ width: "100%", height: "100%", border: "none" }}
      allowTransparency
    />
  );
}
