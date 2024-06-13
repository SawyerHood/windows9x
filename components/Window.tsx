"use client";

import cx from "classnames";
import {
  atom,
  getDefaultStore,
  useAtom,
  useAtomValue,
  useSetAtom,
} from "jotai";
import { focusedWindowAtom } from "@/state/focusedWindow";
import { windowsListAtom } from "@/state/windowsList";
import {
  MIN_WINDOW_SIZE,
  reloadIframe,
  windowAtomFamily,
} from "@/state/window";
import { WindowBody } from "./WindowBody";
import styles from "./Window.module.css";
import {
  MouseEventHandler,
  useRef,
  MouseEvent as ReactMouseEvent,
} from "react";
import Image from "next/image";
import { MenuBar } from "./MenuBar";

const isResizingAtom = atom(false);

export function Window({ id }: { id: string }) {
  const [state, dispatch] = useAtom(windowAtomFamily(id));
  const windowsDispatch = useSetAtom(windowsListAtom);
  const [focusedWindow, setFocusedWindow] = useAtom(focusedWindowAtom);
  const isResizing = useAtomValue(isResizingAtom);

  return (
    <div
      className={cx("window", {
        [styles.jiggle]: state.loading,
      })}
      id={id}
      style={{
        position: "absolute",
        top: state.loading ? state.pos.y : 0,
        left: state.loading ? state.pos.x : 0,
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
        minWidth: MIN_WINDOW_SIZE.width,
        minHeight: MIN_WINDOW_SIZE.height,
      }}
    >
      <div
        className={cx("title-bar", {
          inactive: focusedWindow !== id,
        })}
        onMouseDown={createResizeEvent(
          (e: MouseEvent, delta: { x: number; y: number }) => {
            dispatch({
              type: "MOVE",
              payload: { dx: delta.x, dy: delta.y },
            });
          }
        )}
      >
        <div className={styles.title}>
          {state.icon && (
            <Image src={state.icon} alt={state.title} width={16} height={16} />
          )}
          <div className="title-bar-text">{state.title}</div>
        </div>
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

      <div
        className="window-body"
        style={{
          flex: 1,
          pointerEvents: isResizing ? "none" : "auto",
          overflow: "hidden",
          marginTop: 0,
        }}
      >
        <MenuBar
          options={[
            {
              label: "File",
              items: [
                state.program.type === "iframe"
                  ? {
                      label: "Reload",
                      onClick: () => reloadIframe(id),
                    }
                  : null,
                {
                  label: "Close",
                  onClick: () => {
                    windowsDispatch({ type: "REMOVE", payload: id });
                  },
                },
              ],
            },
          ]}
        />
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
        onMouseDown={createResizeEvent(
          (e: MouseEvent, delta: { x: number; y: number }) => {
            dispatch({
              type: "RESIZE",
              payload: { side: "right", dx: delta.x, dy: delta.y },
            });
          }
        )}
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
        onMouseDown={createResizeEvent(
          (e: MouseEvent, delta: { x: number; y: number }) => {
            dispatch({
              type: "RESIZE",
              payload: { side: "left", dx: delta.x, dy: delta.y },
            });
          }
        )}
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
        onMouseDown={createResizeEvent(
          (e: MouseEvent, delta: { x: number; y: number }) => {
            dispatch({
              type: "RESIZE",
              payload: { side: "bottom", dx: delta.x, dy: delta.y },
            });
          }
        )}
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
        onMouseDown={createResizeEvent(
          (e: MouseEvent, delta: { x: number; y: number }) => {
            dispatch({
              type: "RESIZE",
              payload: { side: "top", dx: delta.x, dy: delta.y },
            });
          }
        )}
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
        onMouseDown={createResizeEvent(
          (e: MouseEvent, delta: { x: number; y: number }) => {
            dispatch({
              type: "RESIZE",
              payload: { side: "top-left", dx: delta.x, dy: delta.y },
            });
          }
        )}
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
        onMouseDown={createResizeEvent(
          (e: MouseEvent, delta: { x: number; y: number }) => {
            dispatch({
              type: "RESIZE",
              payload: { side: "top-right", dx: delta.x, dy: delta.y },
            });
          }
        )}
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
        onMouseDown={createResizeEvent(
          (e: MouseEvent, delta: { x: number; y: number }) => {
            dispatch({
              type: "RESIZE",
              payload: { side: "bottom-left", dx: delta.x, dy: delta.y },
            });
          }
        )}
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
        onMouseDown={createResizeEvent(
          (e: MouseEvent, delta: { x: number; y: number }) => {
            dispatch({
              type: "RESIZE",
              payload: {
                side: "bottom-right",
                dx: delta.x,
                dy: delta.y,
              },
            });
          }
        )}
      ></div>
    </div>
  );
}

function createResizeEvent<T>(
  cb: (e: MouseEvent, delta: { x: number; y: number }) => void
): MouseEventHandler<T> {
  return (e: ReactMouseEvent<T>) => {
    let last = { x: e.clientX, y: e.clientY };
    const handleMouseMove = (e: MouseEvent) => {
      const delta = { x: e.clientX - last.x, y: e.clientY - last.y };
      cb(e, delta);
      last = { x: e.clientX, y: e.clientY };
    };
    getDefaultStore().set(isResizingAtom, true);
    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("blur", handleMouseUp);
      getDefaultStore().set(isResizingAtom, false);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("blur", handleMouseUp);
  };
}
