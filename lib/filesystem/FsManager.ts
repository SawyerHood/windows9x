import {
  getRootDirectoryHandle,
  rootDirectoryHandleAtom,
} from "@/lib/filesystem/rootDirectory";
import {
  Drive,
  StubFile,
  DeepFile,
  DeepFolder,
  ShallowFolder,
  Depth,
} from "./Drive";
import { RealFs } from "./RealFs";
import { atomWithRefresh } from "jotai/utils";
import { atom, getDefaultStore } from "jotai";
import {
  SYSTEM_PATH,
  PROGRAMS_PATH,
  USER_PATH,
  REGISTRY_PATH,
} from "@/lib/filesystem/defaultFileSystem";
import { getOldFormat } from "./getOldFormat";

export class FsManager {
  private adapter: Drive;

  private shallowAtoms: {
    [path: string]: ReturnType<
      typeof atomWithRefresh<Promise<ShallowFolder | null>>
    >;
  } = {};

  private deepAtoms: {
    [path: string]: ReturnType<
      typeof atomWithRefresh<Promise<DeepFolder | null>>
    >;
  } = {};

  private fileAtoms: {
    [path: string]: ReturnType<
      typeof atomWithRefresh<Promise<DeepFile | null>>
    >;
  } = {};

  constructor(handle: FileSystemDirectoryHandle) {
    this.adapter = new Drive(new RealFs(handle));
    this.setupDefaultDirectories();
  }

  public async setupDefaultDirectories(): Promise<void> {
    const defaultDirs = [SYSTEM_PATH, PROGRAMS_PATH, USER_PATH];
    for (const dir of defaultDirs) {
      const exists = await this.getFolder(dir, "shallow");
      if (!exists) {
        await this.createFolder(dir);
      }
    }

    // Create registry file if it doesn't exist
    const registryExists = await this.getFile(REGISTRY_PATH, "shallow");
    if (!registryExists) {
      await this.writeFile(REGISTRY_PATH, "{}");
    }
  }

  public async hasSystemData(): Promise<boolean> {
    const system = await this.getFolder(SYSTEM_PATH, "shallow");
    return !!system;
  }

  async writeFile(path: string, content: string | ArrayBuffer): Promise<void> {
    return this.adapter.writeFile(path, content);
  }

  async createFolder(path: string): Promise<void> {
    return this.adapter.createFolder(path);
  }

  async delete(path: string): Promise<void> {
    return this.adapter.delete(path);
  }

  async getItem(
    path: string,
    depth: "shallow"
  ): Promise<StubFile | ShallowFolder | null>;
  async getItem(
    path: string,
    depth: "deep"
  ): Promise<DeepFile | DeepFolder | null>;
  async getItem(
    path: string,
    depth: Depth = "shallow"
  ): Promise<StubFile | ShallowFolder | DeepFile | DeepFolder | null> {
    const file = await this.getFile(path, depth as any);
    if (file) return file;

    const folder = await this.getFolder(path, depth as any);
    if (folder) return folder;

    return null;
  }

  async getFolder(
    path: string,
    depth: "shallow"
  ): Promise<ShallowFolder | null>;
  async getFolder(path: string, depth: "deep"): Promise<DeepFolder | null>;
  async getFolder(
    path: string,
    depth: Depth = "shallow"
  ): Promise<ShallowFolder | DeepFolder | null> {
    return this.adapter.getFolder(path, depth as any);
  }

  async getFile(path: string, depth: "shallow"): Promise<StubFile | null>;
  async getFile(path: string, depth: "deep"): Promise<DeepFile | null>;
  async getFile(
    path: string,
    depth: Depth = "shallow"
  ): Promise<StubFile | DeepFile | null> {
    return this.adapter.getFile(path, depth as any);
  }

  async insert(path: string, item: DeepFolder | DeepFile): Promise<void> {
    return this.adapter.insert(path, item);
  }

  async move(oldPath: string, newPath: string): Promise<void> {
    return this.adapter.move(oldPath, newPath);
  }

  getFolderAtom(
    path: string,
    depth: "shallow"
  ): ReturnType<typeof atomWithRefresh<Promise<ShallowFolder | null>>>;
  getFolderAtom(
    path: string,
    depth: "deep"
  ): ReturnType<typeof atomWithRefresh<Promise<DeepFolder | null>>>;
  getFolderAtom(
    path: string,
    depth: Depth = "shallow"
  ): ReturnType<
    typeof atomWithRefresh<Promise<ShallowFolder | DeepFolder | null>>
  > {
    const atomsMap = depth === "shallow" ? this.shallowAtoms : this.deepAtoms;

    if (!atomsMap[path]) {
      const atom = atomWithRefresh(async (_get) => {
        return await this.adapter.getFolder(path, depth as any);
      });
      atom.onMount = (set) => {
        const interval = setInterval(() => {
          set();
        }, 500);
        return () => {
          clearInterval(interval);
          delete atomsMap[path];
        };
      };
      atomsMap[path] = atom;
    }
    return atomsMap[path];
  }

  getFileAtom(
    path: string
  ): ReturnType<typeof atomWithRefresh<Promise<DeepFile | null>>> {
    if (!this.fileAtoms[path]) {
      const atom = atomWithRefresh(async (_get) => {
        return await this.adapter.getFile(path, "deep");
      });
      atom.onMount = (set) => {
        const interval = setInterval(() => {
          set();
        }, 500);
        return () => {
          clearInterval(interval);
          delete this.fileAtoms[path];
        };
      };
      this.fileAtoms[path] = atom;
    }
    return this.fileAtoms[path];
  }
}

async function createFsManager(
  dir: FileSystemDirectoryHandle
): Promise<FsManager> {
  // Check if the URL contains the 'reset' search parameter
  const searchParams = new URLSearchParams(window.location.search);
  const shouldReset = searchParams.has("reset");

  if (shouldReset) {
    await resetFs();
  }

  const manager = new FsManager(dir);
  if (!(await manager.hasSystemData())) {
    const oldFormat = getOldFormat();
    if (oldFormat) {
      for (const [name, item] of Object.entries(oldFormat.items)) {
        await manager.insert(name, item as DeepFolder | DeepFile);
      }
    }
  }
  await manager.setupDefaultDirectories();
  return manager;
}

export async function getFsManager(): Promise<FsManager> {
  return await getDefaultStore().get(fsManagerAtom);
}

export const fsManagerAtom = atom(async (get) => {
  const dir = await get(rootDirectoryHandleAtom);
  return createFsManager(dir);
});

async function resetFs() {
  const dir = await getRootDirectoryHandle();
  // Remove all items in the directory
  for await (const entry of dir.values()) {
    await dir.removeEntry(entry.name, { recursive: true });
  }
}
