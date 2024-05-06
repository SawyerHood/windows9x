import { assertNever } from "@/utils/assertNever";
import { atomFamily, atomWithReducer } from "jotai/utils";

export type Program =
  | { type: "welcome" }
  | { type: "run" }
  | { type: "iframe"; src: string };

export type WindowState = {
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

export type WindowAction =
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

export const windowAtomFamily = atomFamily((id: string) => {
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
