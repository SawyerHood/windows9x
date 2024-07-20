import { openDB } from "idb";
import { atom, getDefaultStore } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { getOriginPrivateDirectory } from "file-system-access";

async function getDirectoryHandle() {
  // Check if FileSystemFileHandle has createWritable method
  const hasCreateWritable = "createWritable" in FileSystemFileHandle.prototype;
  let handle: FileSystemDirectoryHandle;

  if (hasCreateWritable) {
    handle = (await getOriginPrivateDirectory()) as FileSystemDirectoryHandle;
  } else {
    handle = (await getOriginPrivateDirectory(
      import("file-system-access/lib/adapters/indexeddb.js")
    )) as FileSystemDirectoryHandle;
  }

  return handle;
}

const DB_NAME = "FileSystemDB";
const STORE_NAME = "FileSystemStore";
const ROOT_KEY = "rootDirectoryHandle";
const MOUNTED_DIRS_KEY = "mountedDirectories";

async function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME);
    },
  });
}

// Update the storage functions to handle multiple directories
async function getStoredDirectories(): Promise<
  Record<string, FileSystemDirectoryHandle>
> {
  const db = await getDb();
  const storedDirs = (await db.get(STORE_NAME, MOUNTED_DIRS_KEY)) || {};
  const validDirs: Record<string, FileSystemDirectoryHandle> = {};

  for (const [name, handle] of Object.entries(storedDirs)) {
    try {
      await (handle as FileSystemDirectoryHandle).requestPermission({
        mode: "readwrite",
      });
      validDirs[name] = handle as FileSystemDirectoryHandle;
    } catch (error) {
      console.warn(`Stored directory handle for "${name}" is no longer valid.`);
    }
  }

  return validDirs;
}

async function setStoredDirectories(
  dirs: Record<string, FileSystemDirectoryHandle>
): Promise<void> {
  const db = await getDb();
  await db.put(STORE_NAME, dirs, MOUNTED_DIRS_KEY);
}

export async function getRootDirectoryHandle(): Promise<FileSystemDirectoryHandle> {
  return getDefaultStore().get(rootDirectoryHandleAtom);
}

export async function setRootDirectoryHandle(
  newHandle: FileSystemDirectoryHandle | null
): Promise<void> {
  getDefaultStore().set(rootDirectoryHandleAtom, newHandle);
}

const privateRootDirectoryHandleAtom =
  atomWithStorage<FileSystemDirectoryHandle | null>(
    ROOT_KEY,
    null,
    {
      getItem: async (key, initialValue) => {
        const db = await getDb();
        const storedHandle = await db.get(STORE_NAME, key);

        if (storedHandle) {
          // Verify if the stored handle is still valid
          try {
            await storedHandle.requestPermission({ mode: "readwrite" });
            return storedHandle;
          } catch (error) {
            console.warn(
              "Stored directory handle is no longer valid. Using default."
            );
          }
        }

        return initialValue;
      },
      setItem: async (key, value) => {
        const db = await getDb();

        if (value) {
          // Verify if the new handle is valid and has the necessary permissions
          try {
            await (value as any).requestPermission({ mode: "readwrite" });
          } catch (error) {
            throw new Error(
              "Unable to set new root directory: Permission denied"
            );
          }
        }

        // Store the new handle
        await db.put(STORE_NAME, value, key);
      },
      removeItem: async (key) => {
        const db = await getDb();
        await db.delete(STORE_NAME, key);
      },
    },
    { getOnInit: true }
  );

const privateMountedDirectoriesAtom = atomWithStorage<
  Record<string, FileSystemDirectoryHandle>
>(
  MOUNTED_DIRS_KEY,
  {},
  {
    getItem: async (_key, _initialValue) => {
      return await getStoredDirectories();
    },
    setItem: async (_key, value) => {
      await setStoredDirectories(value);
    },
    removeItem: async (key) => {
      const db = await getDb();
      await db.delete(STORE_NAME, key);
    },
  },
  { getOnInit: true }
);

export const rootDirectoryHandleAtom = atom(
  async (get) =>
    (await get(privateRootDirectoryHandleAtom)) ?? (await getDirectoryHandle()),
  (_get, set, newHandle: FileSystemDirectoryHandle | null) => {
    set(privateRootDirectoryHandleAtom, newHandle);
  }
);

export const isRootDirectorySetAtom = atom(async (get) => {
  const rootDirectoryHandle = await get(privateRootDirectoryHandleAtom);
  return rootDirectoryHandle !== null;
});

export const mountedDirectoriesAtom = atom(
  (get) => get(privateMountedDirectoriesAtom),
  async (
    get,
    set,
    update: { name: string; handle: FileSystemDirectoryHandle | null }
  ) => {
    const currentDirs = await get(privateMountedDirectoriesAtom);
    if (update.handle === null) {
      const { name } = update;
      const { [name]: _, ...rest } = currentDirs;
      set(privateMountedDirectoriesAtom, rest);
    } else {
      set(privateMountedDirectoriesAtom, {
        ...currentDirs,
        [update.name]: update.handle,
      });
    }
  }
);

export async function mountDirectory(
  name: string,
  handle: FileSystemDirectoryHandle | null
): Promise<void> {
  getDefaultStore().set(mountedDirectoriesAtom, { name, handle });
}

export async function unmountDirectory(name: string): Promise<void> {
  getDefaultStore().set(mountedDirectoriesAtom, { name, handle: null });
}
