import { assertNever } from "@/lib/assertNever";
import { atomWithReducer } from "jotai/utils";

export type WindowsListState = string[];

export type WindowsListAction =
  | { type: "ADD"; payload: string }
  | { type: "REMOVE"; payload: string };

export const windowsListAtom = atomWithReducer(
  [],
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
