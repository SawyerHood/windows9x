import {
  getRootDirectoryHandle,
  rootDirectoryHandleAtom,
} from "@/lib/filesystem/rootDirectory";
import { DeepFile, DeepFolder } from "../lib/filesystem/Drive";
import { atom, getDefaultStore } from "jotai";
import { getOldFormat } from "../lib/filesystem/getOldFormat";
import { FsManager } from "../lib/filesystem/FsManager";

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
