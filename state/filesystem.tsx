import { DEFAULT_FILE_SYSTEM } from "@/lib/filesystem/defaultFileSystem";
import { VirtualFileSystem, VirtualFolder } from "@/lib/filesystem/filesystem";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

const privateFileSystemAtom = atomWithStorage<{ root: VirtualFolder }>(
  "filesystem",
  {
    root: DEFAULT_FILE_SYSTEM.toJSON(),
  }
);

export const fileSystemAtom = atom<
  VirtualFileSystem,
  [VirtualFileSystem | ((vs: VirtualFileSystem) => VirtualFileSystem), any],
  any
>(
  (get) => new VirtualFileSystem({ root: get(privateFileSystemAtom).root }),
  (get, set, update) => {
    const newState =
      typeof update === "function" ? update(get(fileSystemAtom)) : update;
    set(privateFileSystemAtom, { root: newState.toJSON() });
  }
);
