import {
  rootDirectoryHandleAtom,
  mountedDirectoriesAtom,
} from "@/lib/filesystem/directoryMapping";
import { DeepFile, DeepFolder } from "../lib/filesystem/Drive";
import { atom, getDefaultStore } from "jotai";
import { getOldFormat } from "../lib/filesystem/getOldFormat";
import { FsManager } from "../lib/filesystem/FsManager";

async function createFsManager(
  dir: FileSystemDirectoryHandle,
  mountedDirs: Record<string, FileSystemDirectoryHandle>
): Promise<FsManager> {
  const manager = new FsManager(dir, mountedDirs);
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
  const mountedDirs = await get(mountedDirectoriesAtom);
  return createFsManager(dir, mountedDirs);
});

// async function resetFs() {
//   const dir = await getRootDirectoryHandle();
//   // Remove all items in the directory
//   for await (const entry of dir.values()) {
//     await dir.removeEntry(entry.name, { recursive: true });
//   }
// }
