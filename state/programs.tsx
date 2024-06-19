import { atom } from "jotai";
import { atomFamily } from "jotai/utils";
import { fileSystemAtom } from "./filesystem";
import { PROGRAMS_PATH } from "@/lib/filesystem/defaultFileSystem";
import {
  VirtualFileSystem,
  VirtualFolder,
  VirtualItem,
} from "@/lib/filesystem/filesystem";

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

export const programsAtom = atom<ProgramsState, [ProgramAction], void>(
  (get) => {
    const fs = get(fileSystemAtom);
    const programs = fs.listItems(PROGRAMS_PATH);
    return {
      programs: programs.map(getProgramEntry).filter(Boolean) as ProgramEntry[],
    };
  },
  (get, set, action) => {
    const fs = get(fileSystemAtom);
    set(fileSystemAtom, programsReducer(fs, action));
  }
);

function getProgramEntry(item: VirtualItem): ProgramEntry | null {
  if (item.type !== "folder") return null;
  const folder = item as VirtualFolder;
  const main = folder.items["main.exe"];
  if (!main || main.type !== "file") {
    return null;
  }

  const index = folder.items["index.html"];
  let code: string | null = null;
  if (index && index.type === "file") {
    code = index.content;
  }
  const config = JSON.parse(main.content);
  return {
    ...config,
    id: folder.name,
    name: folder.name,
    code,
  };
}

function programsReducer(
  fs: VirtualFileSystem,
  action: ProgramAction
): VirtualFileSystem {
  switch (action.type) {
    case "ADD_PROGRAM": {
      const { code, id: _id, name: _name, ...rest } = action.payload;
      const path = `${PROGRAMS_PATH}/${action.payload.id}`;
      let newFs = fs
        .createFolder(path)
        .createFile(`${path}/main.exe`, JSON.stringify(rest))
        .createFile(`${path}/index.html`, code ?? "");

      return newFs;
    }
    case "REMOVE_PROGRAM": {
      return fs.delete(`${PROGRAMS_PATH}/${action.payload}`);
    }
    case "UPDATE_PROGRAM": {
      const path = `${PROGRAMS_PATH}/${action.payload.id}`;
      const { id: _id, name: _name, ...rest } = action.payload;
      let newFs = fs;

      if ("code" in rest) {
        const code = rest.code;
        delete rest.code;
        newFs = newFs.updateFile(`${path}/index.html`, code ?? "");
      }

      const existing = JSON.parse(fs.readFile(`${path}/main.exe`));
      if (existing) {
        newFs = newFs.updateFile(
          `${path}/main.exe`,
          JSON.stringify({ ...existing, ...rest })
        );
      }
      return newFs;
    }
  }
}

export const programAtomFamily = atomFamily((id: string) =>
  atom((get) => get(programsAtom).programs.find((p) => p.id === id))
);
