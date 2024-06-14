import { atom, useAtom } from "jotai";
import { atomFamily, atomWithStorage } from "jotai/utils";

export type ProgramEntry = {
  id: string;
  name: string;
  prompt: string;
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
      payload: Partial<ProgramEntry> & { id: string };
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
      return {
        ...state,
        programs: state.programs.map((p) =>
          p.id === action.payload.id ? { ...p, ...action.payload } : p
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

export const programAtomFamily = atomFamily((id: string) =>
  atom((get) => get(programsAtom).programs.find((p) => p.id === id))
);
