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
  currentVersion?: number;
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
    }
  | {
      type: "CHANGE_VERSION";
      payload: { id: string; version: number };
    }
  | {
      type: "DELETE_VERSION";
      payload: { id: string; version: number };
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
    currentVersion: config.currentVersion || Date.now(),
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
      const timestamp = Date.now();
      let newFs = fs
        .createFolder(path)
        .createFile(
          `${path}/main.exe`,
          JSON.stringify({ ...rest, currentVersion: timestamp })
        )
        .createFile(`${path}/index.html`, code ?? "");

      // Add version
      newFs = addVersion(newFs, path, code ?? "", timestamp);

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
        const timestamp = Date.now();
        newFs = newFs.updateFile(`${path}/index.html`, code ?? "");

        // Add version
        newFs = addVersion(newFs, path, code ?? "", timestamp);

        // Update currentVersion in main.exe
        const existing = JSON.parse(newFs.readFile(`${path}/main.exe`));
        newFs = newFs.updateFile(
          `${path}/main.exe`,
          JSON.stringify({ ...existing, ...rest, currentVersion: timestamp })
        );
      } else {
        const existing = JSON.parse(newFs.readFile(`${path}/main.exe`));
        newFs = newFs.updateFile(
          `${path}/main.exe`,
          JSON.stringify({ ...existing, ...rest })
        );
      }
      return newFs;
    }
    case "CHANGE_VERSION": {
      const { id, version } = action.payload;
      const path = `${PROGRAMS_PATH}/${id}`;
      const versionsPath = `${path}/versions`;
      const versionFileName = `${version}.html`;

      let newFs = fs;

      // Read the code from the specified version
      const newCode = newFs.readFile(`${versionsPath}/${versionFileName}`);

      // Update the current code
      newFs = newFs.updateFile(`${path}/index.html`, newCode);

      // Update currentVersion in main.exe
      const existing = JSON.parse(newFs.readFile(`${path}/main.exe`));
      newFs = newFs.updateFile(
        `${path}/main.exe`,
        JSON.stringify({ ...existing, currentVersion: version })
      );

      return newFs;
    }
    case "DELETE_VERSION": {
      const { id, version } = action.payload;
      const path = `${PROGRAMS_PATH}/${id}`;
      const versionsPath = `${path}/versions`;
      const versionFileName = `${version}.html`;

      let newFs = fs;

      // Delete the version file
      newFs = newFs.delete(`${versionsPath}/${versionFileName}`);

      // If the deleted version was the current version, set the current version to the latest remaining version
      const existing = JSON.parse(newFs.readFile(`${path}/main.exe`));
      if (existing.currentVersion === version) {
        const remainingVersions = newFs.listItems(versionsPath);
        const latestVersion = Math.max(
          ...remainingVersions
            .map((item) => parseInt(item.name.replace(".html", ""), 10))
            .filter((v) => !isNaN(v))
        );

        if (!isNaN(latestVersion)) {
          const latestCode = newFs.readFile(
            `${versionsPath}/${latestVersion}.html`
          );
          newFs = newFs.updateFile(`${path}/index.html`, latestCode);
          newFs = newFs.updateFile(
            `${path}/main.exe`,
            JSON.stringify({ ...existing, currentVersion: latestVersion })
          );
        }
      }

      return newFs;
    }
  }
}

function addVersion(
  fs: VirtualFileSystem,
  programPath: string,
  code: string,
  timestamp: number
): VirtualFileSystem {
  const versionsPath = `${programPath}/versions`;
  let newFs = fs;

  // Create versions folder if it doesn't exist
  if (!newFs.exists(versionsPath)) {
    newFs = newFs.createFolder(versionsPath);
  }

  const versionFileName = `${timestamp}.html`;
  newFs = newFs.createFile(`${versionsPath}/${versionFileName}`, code);

  return newFs;
}

export const programAtomFamily = atomFamily((id: string) =>
  atom((get) => get(programsAtom).programs.find((p) => p.id === id))
);

export const programVersionsAtomFamily = atomFamily((id: string) =>
  atom((get) => {
    const fs = get(fileSystemAtom);
    const programPath = `${PROGRAMS_PATH}/${id}`;
    const versionsPath = `${programPath}/versions`;

    if (!fs.exists(versionsPath)) {
      return [];
    }

    const folder = fs.getFolder(versionsPath);
    return Object.keys(folder.items)
      .filter((file: string) => file.endsWith(".html"))
      .map((file: string) => parseInt(file.replace(".html", ""), 10))
      .sort((a: number, b: number) => b - a); // Sort in descending order (newest first)
  })
);
