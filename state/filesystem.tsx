import { throttle } from "@/lib/debounce";
import { DEFAULT_FILE_SYSTEM } from "@/lib/filesystem/defaultFileSystem";
import { VirtualFileSystem } from "@/lib/filesystem/filesystem";
import {
  createVfsFromRealFs,
  isRealFsInitialized,
  syncVfsToRealFs,
  changeRootDirectory,
} from "@/lib/filesystem/fsSync";
import { atom, getDefaultStore } from "jotai";
// import { atomWithStorage } from "jotai/utils";

let hasInitialized = false;

// const privateFileSystemAtom = atomWithStorage<{ root: VirtualFolder }>(
//   "filesystem",
//   {
//     root: DEFAULT_FILE_SYSTEM.toJSON(),
//   }
// );

// export const fileSystemAtom = atom<
//   VirtualFileSystem,
//   [VirtualFileSystem | ((vs: VirtualFileSystem) => VirtualFileSystem)],
//   any
// >(
//   (get) => new VirtualFileSystem({ root: get(privateFileSystemAtom).root }),
//   (get, set, update) => {
//     const newState =
//       typeof update === "function" ? update(get(fileSystemAtom)) : update;
//     set(privateFileSystemAtom, { root: newState.toJSON() });
//   }
// );

export const privateFileSystemAtom =
  atom<VirtualFileSystem>(DEFAULT_FILE_SYSTEM);

privateFileSystemAtom.onMount = (set) => {
  if (!hasInitialized) {
    hasInitialized = true;
    (async () => {
      if (!(await isRealFsInitialized())) {
        return;
      }
      try {
        const vfs = await createVfsFromRealFs();
        set(vfs);
      } catch (error) {
        console.error("Failed to create VFS from OPFS:", error);
        // Fallback to DEFAULT_FILE_SYSTEM if OPFS fails
        set(DEFAULT_FILE_SYSTEM);
      }
    })();
  }
};

export const fileSystemAtom = atom<
  VirtualFileSystem,
  [VirtualFileSystem | ((vs: VirtualFileSystem) => VirtualFileSystem)],
  any
>(
  (get) => {
    return get(privateFileSystemAtom);
  },
  (get, set, update) => {
    const newState =
      typeof update === "function" ? update(get(fileSystemAtom)) : update;
    set(privateFileSystemAtom, newState);
    writeToRealFs(newState);
  }
);

const writeToRealFs = throttle(async (vfs: VirtualFileSystem) => {
  await syncVfsToRealFs(vfs);
}, 1000);

export async function pickRootDirectory() {
  await changeRootDirectory();
  if (!(await isRealFsInitialized())) {
    getDefaultStore().set(privateFileSystemAtom, DEFAULT_FILE_SYSTEM);
    writeToRealFs(DEFAULT_FILE_SYSTEM);
    return;
  }
  const vfs = await createVfsFromRealFs();
  getDefaultStore().set(privateFileSystemAtom, vfs);
}

// export const fileSystemAtom = atom<VirtualFileSystem>((get) => {
//   if (!hasInitialized) {
//     hasInitialized = true;
//     get(fileSystemAtom).sync();
//   }
//   return get(fileSystemAtom);
// });
