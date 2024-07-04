import { assert } from "@/lib/assert";
import { assertNever } from "@/lib/assertNever";
import { getDefaultStore } from "jotai";
import { atomFamily, atomWithReducer } from "jotai/utils";
import { programAtomFamily, programsAtom } from "./programs";

export type Program =
  | { type: "welcome" }
  | { type: "run" }
  | { type: "iframe"; programID: string; canSave?: boolean; canOpen?: boolean }
  | { type: "help"; targetWindowID?: string }
  | { type: "settings" }
  | {
      type: "explorer";
      currentPath?: string;
      action?: (path: string) => void;
      actionText?: string;
    };

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
  loading: boolean;
};

export type WindowAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "TOGGLE_MAXIMIZE" }
  | { type: "TOGGLE_MINIMIZE" }
  | { type: "RESTORE" }
  | { type: "MOVE"; payload: { dx: number; dy: number } }
  | {
      type: "RESIZE";
      payload: {
        side:
          | "top"
          | "bottom"
          | "left"
          | "right"
          | "top-left"
          | "top-right"
          | "bottom-left"
          | "bottom-right";
        dx: number;
        dy: number;
      };
    }
  | {
      type: "INIT";
      payload: {
        title: string;
        program: WindowState["program"];
        id: string;
        loading?: boolean;
        size?: WindowState["size"];
        pos?: WindowState["pos"];
        icon?: string;
      };
    }
  | { type: "SET_ICON"; payload: string }
  | { type: "UPDATE_PROGRAM"; payload: Partial<WindowState["program"]> };

export const windowAtomFamily = atomFamily((id: string) => {
  return atomWithReducer(
    {
      status: "normal",
      pos: { x: 100, y: 100 },
      size: { width: 400, height: "auto" },
      title: "Welcome to Windows 9X",
      program: {
        type: "welcome",
      },
      id,
      loading: false,
    },
    windowReducer
  );
});

export const MIN_WINDOW_SIZE = { width: 300, height: 100 };

function clampSize(size: WindowState["size"]): WindowState["size"] {
  return {
    width: Math.max(size.width, MIN_WINDOW_SIZE.width),
    height:
      size.height === "auto"
        ? "auto"
        : Math.max(size.height, MIN_WINDOW_SIZE.height),
  };
}

function enforceInvariants(state: WindowState): WindowState {
  const windowWidth =
    typeof window !== "undefined" ? window.innerWidth : Infinity;
  const windowHeight =
    typeof window !== "undefined" ? window.innerHeight : Infinity;

  const halfWindowWidth = state.size.width / 2;
  const halfWindowHeight =
    state.size.height === "auto"
      ? MIN_WINDOW_SIZE.height / 2
      : state.size.height / 2;

  return {
    ...state,
    pos: {
      x: Math.min(
        Math.max(state.pos.x, -halfWindowWidth),
        windowWidth - halfWindowWidth
      ),
      y: Math.min(
        Math.max(state.pos.y, -halfWindowHeight),
        windowHeight - halfWindowHeight
      ),
    },
  };
}

function windowReducerInner(
  state: WindowState,
  action: WindowAction
): WindowState {
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
      const newState = handleResize(state, action);
      return {
        ...newState,
        size: clampSize(newState.size),
      };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ICON":
      return { ...state, icon: action.payload };
    case "UPDATE_PROGRAM":
      return {
        ...state,
        program: { ...state.program, ...action.payload } as any,
      };
    default:
      assertNever(action);
  }

  return state;
}

function windowReducer(state: WindowState, action: WindowAction): WindowState {
  return enforceInvariants(windowReducerInner(state, action));
}

function handleResize(state: WindowState, action: WindowAction) {
  if (action.type !== "RESIZE") {
    return state;
  }

  switch (action.payload.side) {
    case "top": {
      const delta = -action.payload.dy;
      return {
        ...state,
        size: {
          ...state.size,
          height:
            (state.size.height === "auto" ? 0 : state.size.height) + delta,
        },
        pos: {
          ...state.pos,
          y: state.pos.y - delta,
        },
      };
    }

    case "bottom": {
      const delta = action.payload.dy;
      return {
        ...state,
        size: {
          ...state.size,
          height:
            (state.size.height === "auto" ? 0 : state.size.height) + delta,
        },
      };
    }
    case "left": {
      const delta = -action.payload.dx;
      return {
        ...state,
        size: {
          ...state.size,
          width: state.size.width + delta,
        },
        pos: {
          ...state.pos,
          x: state.pos.x - delta,
        },
      };
    }
    case "right": {
      const delta = action.payload.dx;
      return {
        ...state,
        size: {
          ...state.size,
          width: state.size.width + delta,
        },
      };
    }
    case "bottom-right": {
      const { dx, dy } = action.payload;
      return {
        ...state,
        size: {
          ...state.size,
          width: state.size.width + dx,
          height: (state.size.height === "auto" ? 0 : state.size.height) + dy,
        },
      };
    }
    case "top-right": {
      const dx = action.payload.dx;
      const dy = -action.payload.dy;
      return {
        ...state,
        size: {
          ...state.size,
          width: state.size.width + dx,
          height: (state.size.height === "auto" ? 0 : state.size.height) + dy,
        },
        pos: {
          ...state.pos,
          y: state.pos.y - dy,
        },
      };
    }
    case "bottom-left": {
      const dx = -action.payload.dx;
      const dy = action.payload.dy;
      return {
        ...state,
        size: {
          ...state.size,
          width: state.size.width + dx,
          height: (state.size.height === "auto" ? 0 : state.size.height) + dy,
        },
        pos: {
          ...state.pos,
          x: state.pos.x - dx,
        },
      };
    }
    case "top-left": {
      const dx = -action.payload.dx;
      const dy = -action.payload.dy;
      return {
        ...state,
        size: {
          ...state.size,
          width: state.size.width + dx,
          height: (state.size.height === "auto" ? 0 : state.size.height) + dy,
        },
        pos: {
          ...state.pos,
          x: state.pos.x - dx,
          y: state.pos.y - dy,
        },
      };
    }
  }
}

export function getIframeID(id: string) {
  return `iframe-${id}`;
}

export function reloadIframe(id: string) {
  const store = getDefaultStore();
  const window = store.get(windowAtomFamily(id));
  assert(window.program.type === "iframe", "Window is not an iframe");
  const program = store.get(programAtomFamily(window.program.programID));
  assert(program, "Program not found");

  store.set(programsAtom, {
    type: "UPDATE_PROGRAM",
    payload: { id: program.id, code: undefined },
  });

  const iframe = getIframe(id);
  if (iframe) {
    iframe.contentWindow?.location.reload();
  }
}

export function getIframe(id: string): HTMLIFrameElement | null {
  return document.getElementById(getIframeID(id)) as HTMLIFrameElement | null;
}
