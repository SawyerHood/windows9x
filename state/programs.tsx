import { atom } from "jotai";
import { atomFamily } from "jotai/utils";
import { PROGRAMS_PATH } from "@/lib/filesystem/defaultFileSystem";
import { getFsManager } from "@/state/fsManager";
import { DeepFolder, DeepItem } from "@/lib/filesystem/Drive";

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

export const programsAtom = atom<Promise<ProgramsState>, [ProgramAction], void>(
  async (get) => {
    const fsManager = await getFsManager();
    const programs = await get(fsManager.getFolderAtom(PROGRAMS_PATH, "deep"));
    if (!programs) {
      return {
        programs: [],
      };
    }
    return {
      programs: Object.values(programs.items)
        .map(getProgramEntry)
        .filter(Boolean) as ProgramEntry[],
    };
  },
  async (_get, _set, action) => {
    const fsManager = await getFsManager();
    await programsReducer(fsManager, action);
  }
);

function getProgramEntry(item: DeepItem): ProgramEntry | null {
  if (item.type !== "folder") return null;
  const folder = item as DeepFolder;
  const main = folder.items["main.exe"];
  if (!main || main.type !== "file") {
    return null;
  }

  const index = folder.items["index.html"];
  let code: string | null = null;
  if (index && index.type === "file") {
    code = index.content as string;
  }
  const config = main.content ? JSON.parse(main.content as string) : {};
  return {
    ...config,
    id: folder.name,
    name: folder.name,
    code,
    currentVersion: config.currentVersion || Date.now(),
  };
}

async function programsReducer(
  fsManager: Awaited<ReturnType<typeof getFsManager>>,
  action: ProgramAction
): Promise<void> {
  switch (action.type) {
    case "ADD_PROGRAM": {
      const { code, id: _id, name: _name, ...rest } = action.payload;
      const path = `${PROGRAMS_PATH}/${action.payload.id}`;
      const timestamp = Date.now();
      await fsManager.createFolder(path);
      await fsManager.writeFile(
        `${path}/main.exe`,
        JSON.stringify({ ...rest, currentVersion: timestamp })
      );
      await fsManager.writeFile(`${path}/index.html`, code ?? "");

      // Add version
      await addVersion(fsManager, path, code ?? "", timestamp);
      break;
    }
    case "REMOVE_PROGRAM": {
      await fsManager.delete(`${PROGRAMS_PATH}/${action.payload}`);
      break;
    }
    case "UPDATE_PROGRAM": {
      const path = `${PROGRAMS_PATH}/${action.payload.id}`;
      const { id: _id, name: _name, ...rest } = action.payload;

      if ("code" in rest) {
        const code = rest.code;
        delete rest.code;
        const timestamp = Date.now();
        await fsManager.writeFile(`${path}/index.html`, code ?? "");

        // Add version
        await addVersion(fsManager, path, code ?? "", timestamp);

        // Update currentVersion in main.exe
        const existingContent = await (
          await fsManager.getFile(`${path}/main.exe`, "deep")
        )?.content;
        const existing = JSON.parse(existingContent as string);
        await fsManager.writeFile(
          `${path}/main.exe`,
          JSON.stringify({ ...existing, ...rest, currentVersion: timestamp })
        );
      } else {
        const existingContent = await (
          await fsManager.getFile(`${path}/main.exe`, "deep")
        )?.content;
        const existing = JSON.parse(existingContent as string);
        await fsManager.writeFile(
          `${path}/main.exe`,
          JSON.stringify({ ...existing, ...rest })
        );
      }
      break;
    }
    case "CHANGE_VERSION": {
      const { id, version } = action.payload;
      const path = `${PROGRAMS_PATH}/${id}`;
      const versionsPath = `${path}/versions`;
      const versionFileName = `${version}.html`;

      // Read the code from the specified version
      const newCode = await fsManager.getFile(
        `${versionsPath}/${versionFileName}`,
        "deep"
      );

      if (!newCode?.content) {
        return;
      }

      // Update the current code
      await fsManager.writeFile(`${path}/index.html`, newCode?.content);

      // Update currentVersion in main.exe
      const existingContent = await (
        await fsManager.getFile(`${path}/main.exe`, "deep")
      )?.content;
      const existing = JSON.parse(existingContent as string);
      await fsManager.writeFile(
        `${path}/main.exe`,
        JSON.stringify({ ...existing, currentVersion: version })
      );

      break;
    }
    case "DELETE_VERSION": {
      const { id, version } = action.payload;
      const path = `${PROGRAMS_PATH}/${id}`;
      const versionsPath = `${path}/versions`;
      const versionFileName = `${version}.html`;

      // Delete the version file
      await fsManager.delete(`${versionsPath}/${versionFileName}`);

      // If the deleted version was the current version, set the current version to the latest remaining version
      const existingContent = await (
        await fsManager.getFile(`${path}/main.exe`, "deep")
      )?.content;
      const existing = JSON.parse(existingContent as string);
      if (existing.currentVersion === version) {
        const remainingVersions =
          Object.keys(
            (await fsManager.getFolder(versionsPath, "shallow"))?.items ?? {}
          ) ?? [];
        const latestVersion = Math.max(
          ...remainingVersions
            .map((item) => parseInt(item.replace(".html", ""), 10))
            .filter((v) => !isNaN(v))
        );

        if (!isNaN(latestVersion)) {
          const latestCode = await fsManager.getFile(
            `${versionsPath}/${latestVersion}.html`,
            "deep"
          );
          await fsManager.writeFile(
            `${path}/index.html`,
            latestCode?.content ?? ""
          );
          await fsManager.writeFile(
            `${path}/main.exe`,
            JSON.stringify({ ...existing, currentVersion: latestVersion })
          );
        }
      }

      break;
    }
  }
}

async function addVersion(
  fsManager: Awaited<ReturnType<typeof getFsManager>>,
  programPath: string,
  code: string,
  timestamp: number
): Promise<void> {
  const versionsPath = `${programPath}/versions`;

  // Create versions folder if it doesn't exist
  const folder = await fsManager.getFolder(versionsPath, "shallow");
  if (!folder) {
    await fsManager.createFolder(versionsPath);
  }

  const versionFileName = `${timestamp}.html`;
  await fsManager.writeFile(`${versionsPath}/${versionFileName}`, code);
}

export const programAtomFamily = atomFamily((id: string) =>
  atom(async (get) => {
    const p = await get(programsAtom);
    return p.programs.find((p) => p.id === id);
  })
);

export const programVersionsAtomFamily = atomFamily((id: string) =>
  atom(async (get) => {
    const fsManager = await getFsManager();
    const programPath = `${PROGRAMS_PATH}/${id}`;
    const versionsPath = `${programPath}/versions`;

    const folder = await get(fsManager.getFolderAtom(versionsPath, "shallow"));
    if (!folder) {
      return [];
    }

    return Object.keys(folder.items)
      .filter((file: string) => file.endsWith(".html"))
      .map((file: string) => parseInt(file.replace(".html", ""), 10))
      .sort((a: number, b: number) => b - a); // Sort in descending order (newest first)
  })
);
