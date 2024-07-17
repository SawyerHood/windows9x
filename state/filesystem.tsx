// import { throttle } from "@/lib/debounce";
import { DEFAULT_FILE_SYSTEM } from "@/lib/filesystem/defaultFileSystem";
import { VirtualFileSystem } from "@/lib/filesystem/filesystem";
import {
  createVfsFromRealFs,
  isRealFsInitialized,
  syncVfsToRealFs,
  changeRootDirectory,
  updateVfsFromRealFs,
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
      if (await isRealFsInitialized()) {
        try {
          const vfs = await createVfsFromRealFs();
          set(vfs);
        } catch (error) {
          console.error("Failed to create VFS from OPFS:", error);
          // Fallback to DEFAULT_FILE_SYSTEM if OPFS fails
          set(DEFAULT_FILE_SYSTEM);
        }
      }
      startSyncing();
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
    // writeToRealFs(newState);
    isFsDirty = true;
  }
);

let isFsDirty = false;

function startSyncing() {
  const sync = async () => {
    if (isFsDirty) {
      isFsDirty = false;
      let newVfs = await syncVfsToRealFs(
        getDefaultStore().get(privateFileSystemAtom)
      );
      getDefaultStore().set(privateFileSystemAtom, newVfs);
      newVfs = await updateVfsFromRealFs(newVfs);
      getDefaultStore().set(privateFileSystemAtom, newVfs);
    }
    setTimeout(sync, 500);
  };

  setTimeout(sync, 500);
}

// const writeToRealFs = throttle(async (vfs: VirtualFileSystem) => {
//   // TODO there might be a race condition here
//   const newVfs = await syncVfsToRealFs(vfs);
//   getDefaultStore().set(privateFileSystemAtom, newVfs);
// }, 1000);

export async function pickRootDirectory() {
  await changeRootDirectory();
  if (!(await isRealFsInitialized())) {
    getDefaultStore().set(privateFileSystemAtom, DEFAULT_FILE_SYSTEM);
    await syncVfsToRealFs(DEFAULT_FILE_SYSTEM);
    return;
  }
  const vfs = await createVfsFromRealFs();
  getDefaultStore().set(privateFileSystemAtom, vfs);
}
