"use client";

import cx from "classnames";
import { useAtom, useSetAtom } from "jotai";
import { focusedWindowAtom } from "@/state/focusedWindowAtom";
import { windowsListAtom } from "@/state/windowsList";
import { windowAtomFamily } from "@/state/window";
import { WindowBody } from "./WindowBody";

export function Window({ id }: { id: string }) {
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
        minWidth: 300,
        minHeight: 100,
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
          cursor: "ew-resize",
        }}
        onMouseDown={createResizeEvent((e: MouseEvent) => {
          dispatch({
            type: "RESIZE",
            payload: { side: "right", dx: e.movementX, dy: e.movementY },
          });
        })}
      ></div>
      {/* left side */}
      <div
        style={{
          top: 0,
          left: -4,
          bottom: 0,
          position: "absolute",
          width: 7,
          cursor: "ew-resize",
        }}
        onMouseDown={createResizeEvent((e: MouseEvent) => {
          dispatch({
            type: "RESIZE",
            payload: { side: "left", dx: e.movementX, dy: e.movementY },
          });
        })}
      ></div>
      {/* bottom side */}
      <div
        style={{
          left: 0,
          right: 0,
          bottom: -4,
          position: "absolute",
          height: 7,
          cursor: "ns-resize",
        }}
        onMouseDown={createResizeEvent((e: MouseEvent) => {
          dispatch({
            type: "RESIZE",
            payload: { side: "bottom", dx: e.movementX, dy: e.movementY },
          });
        })}
      ></div>
      {/* top side */}
      <div
        style={{
          top: -4,
          left: 0,
          right: 0,
          position: "absolute",
          height: 7,
          cursor: "ns-resize",
        }}
        onMouseDown={createResizeEvent((e: MouseEvent) => {
          dispatch({
            type: "RESIZE",
            payload: { side: "top", dx: e.movementX, dy: e.movementY },
          });
        })}
      ></div>
      {/* top left */}
      <div
        style={{
          top: -4,
          left: -4,
          position: "absolute",
          width: 7,
          height: 7,
          cursor: "nwse-resize",
        }}
        onMouseDown={createResizeEvent((e: MouseEvent) => {
          dispatch({
            type: "RESIZE",
            payload: { side: "top-left", dx: e.movementX, dy: e.movementY },
          });
        })}
      ></div>
      {/* top right */}
      <div
        style={{
          top: -4,
          right: -4,
          position: "absolute",
          width: 7,
          height: 7,
          cursor: "nesw-resize",
        }}
        onMouseDown={createResizeEvent((e: MouseEvent) => {
          dispatch({
            type: "RESIZE",
            payload: { side: "top-right", dx: e.movementX, dy: e.movementY },
          });
        })}
      ></div>
      {/* bottom left */}
      <div
        style={{
          bottom: -4,
          left: -4,
          position: "absolute",
          width: 7,
          height: 7,
          cursor: "nesw-resize",
        }}
        onMouseDown={createResizeEvent((e: MouseEvent) => {
          dispatch({
            type: "RESIZE",
            payload: { side: "bottom-left", dx: e.movementX, dy: e.movementY },
          });
        })}
      ></div>
      {/* bottom right */}
      <div
        style={{
          bottom: -4,
          right: -4,
          position: "absolute",
          width: 7,
          height: 7,
          cursor: "nwse-resize",
        }}
        onMouseDown={createResizeEvent((e: MouseEvent) => {
          dispatch({
            type: "RESIZE",
            payload: { side: "bottom-right", dx: e.movementX, dy: e.movementY },
          });
        })}
      ></div>
    </div>
  );
}

function createResizeEvent(cb: (e: MouseEvent) => void) {
  return () => {
    const handleMouseMove = (e: MouseEvent) => {
      cb(e);
    };
    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };
}
