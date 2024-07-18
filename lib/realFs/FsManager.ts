import { getRootDirectoryHandle } from "@/lib/filesystem/fsSync";
import {
  FsAdapter,
  StubFile,
  DeepFile,
  DeepFolder,
  ShallowFolder,
  Depth,
} from "./FsAdapter";
import { RealFs } from "./RealFs";
import { atomWithRefresh } from "jotai/utils";
import { atom } from "jotai";
import {
  SYSTEM_PATH,
  PROGRAMS_PATH,
  USER_PATH,
  REGISTRY_PATH,
} from "@/lib/filesystem/defaultFileSystem";

export class FsManager {
  private adapter: FsAdapter;

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
    this.adapter = new FsAdapter(new RealFs(handle));
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

async function createFsManager(): Promise<FsManager> {
  const dir = await getRootDirectoryHandle();
  const manager = new FsManager(dir);
  await manager.setupDefaultDirectories();
  return manager;
}

let manager: FsManager;
export async function getFsManager(): Promise<FsManager> {
  if (!manager) {
    manager = await createFsManager();
  }
  return manager;
}

export const fsManagerAtom = atom(async () => {
  const fs = await getFsManager();
  return fs;
});