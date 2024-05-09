import { atom, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export type ProgramEntry = {
  name: string;
  url?: string;
  code?: string;
  icon?: string | null;
};

type ProgramsState = {
  programs: ProgramEntry[];
};

type ProgramAction =
  | { type: "ADD_PROGRAM"; payload: ProgramEntry }
  | { type: "REMOVE_PROGRAM"; payload: string }
  | {
      type: "UPDATE_PROGRAM";
      payload: ProgramEntry;
    };

function programsReducer(
  state: ProgramsState,
  action: ProgramAction
): ProgramsState {
  switch (action.type) {
    case "ADD_PROGRAM":
      return { ...state, programs: [...state.programs, action.payload] };
    case "REMOVE_PROGRAM":
      return {
        ...state,
        programs: state.programs.filter((p) => p.name !== action.payload),
      };
    case "UPDATE_PROGRAM":
      const program = state.programs.find(
        (p) => p.name === action.payload.name
      );
      if (!program) {
        return {
          ...state,
          programs: [...state.programs, action.payload],
        };
      }
      return {
        ...state,
        programs: state.programs.map((p) =>
          p.name === action.payload.name ? { ...p, ...action.payload } : p
        ),
      };
  }
}

const privateProgramsAtom = atomWithStorage<ProgramsState>("programs", {
  programs: [],
});

export const programsAtom = atom<ProgramsState, [ProgramAction], void>(
  (get) => get(privateProgramsAtom),
  (get, set, action) => {
    set(privateProgramsAtom, programsReducer(get(privateProgramsAtom), action));
  }
);
