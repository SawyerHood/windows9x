import { assertNever } from "@/utils/assertNever";
import { atomFamily, atomWithReducer } from "jotai/utils";

export type Program =
  | { type: "welcome" }
  | { type: "run" }
  | { type: "iframe"; src?: string; srcDoc?: string }
  | { type: "paint" };

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
  | { type: "SET_ICON"; payload: string };

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
      const newState = handleResize(state, action);
      return {
        ...newState,
        size: clampSize(newState.size),
      };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ICON":
      return { ...state, icon: action.payload };
    default:
      assertNever(action);
  }

  return state;
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
  const iframe = document.getElementById(getIframeID(id));
  if (iframe && iframe instanceof HTMLIFrameElement) {
    iframe.contentWindow?.location.reload();
  }
}
