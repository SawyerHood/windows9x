import { openDB } from "idb";
import { atom, getDefaultStore } from "jotai";
import { atomWithStorage } from "jotai/utils";

const DB_NAME = "FileSystemDB";
const STORE_NAME = "FileSystemStore";
const ROOT_KEY = "rootDirectoryHandle";

async function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME);
    },
  });
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
            await value.requestPermission({ mode: "readwrite" });
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

export const rootDirectoryHandleAtom = atom(
  async (get) =>
    (await get(privateRootDirectoryHandleAtom)) ??
    (await navigator.storage.getDirectory()),
  (_get, set, newHandle: FileSystemDirectoryHandle | null) => {
    set(privateRootDirectoryHandleAtom, newHandle);
  }
);
