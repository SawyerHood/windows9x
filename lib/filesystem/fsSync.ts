import { openDB } from "idb";

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
  const db = await getDb();
  const storedHandle = await db.get(STORE_NAME, ROOT_KEY);

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

  return navigator.storage.getDirectory();
}
