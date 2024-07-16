import {
  VirtualFileSystem,
  VirtualFolder,
  VirtualFile,
  createVirtualFolder,
  createVirtualFile,
} from "./filesystem";
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

async function getRootDirectoryHandle(): Promise<FileSystemDirectoryHandle> {
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

export async function changeRootDirectory(): Promise<void> {
  try {
    const directoryHandle = await (window as any).showDirectoryPicker();
    const db = await getDb();
    await db.put(STORE_NAME, directoryHandle, ROOT_KEY);
    console.log("Root directory changed successfully.");
  } catch (error) {
    console.error("Failed to change root directory:", error);
  }
}

export async function isRealFsInitialized(): Promise<boolean> {
  try {
    const root = await getRootDirectoryHandle();
    await root.getDirectoryHandle("system", { create: false });
    return true;
  } catch (error) {
    return false;
  }
}

export async function syncVfsToRealFs(vfs: VirtualFileSystem): Promise<void> {
  const root = await getRootDirectoryHandle();
  await syncFolderToRealFs(root, vfs.getFolder(""), "");
}

async function syncFolderToRealFs(
  actualFolder: FileSystemDirectoryHandle,
  virtualFolder: VirtualFolder,
  path: string
): Promise<void> {
  // Delete items that are not in the virtual filesystem
  for await (const [name] of actualFolder.entries()) {
    if (!virtualFolder.items[name]) {
      await actualFolder.removeEntry(name, { recursive: true });
    }
  }

  // Add or update items from the virtual filesystem
  for (const [name, item] of Object.entries(virtualFolder.items)) {
    const itemPath = path ? `${path}/${name}` : name;

    if (item.type === "file") {
      const fileHandle = await actualFolder.getFileHandle(name, {
        create: true,
      });

      // Check if the file needs to be updated
      //   if (await shouldWriteFileToRealFs(fileHandle, item)) {
      const writable = await fileHandle.createWritable();
      await writable.write(item.content);
      await writable.close();
      //   }
    } else if (item.type === "folder") {
      const folderHandle = await actualFolder.getDirectoryHandle(name, {
        create: true,
      });
      await syncFolderToRealFs(folderHandle, item, itemPath);
    }
  }
}

async function shouldWriteFileToRealFs(
  fileHandle: FileSystemFileHandle,
  virtualFile: VirtualFile
): Promise<boolean> {
  try {
    const file = await fileHandle.getFile();
    const actualLastModified = file.lastModified;
    return virtualFile.lastModified > actualLastModified;
  } catch (error) {
    // If there's an error (e.g., file doesn't exist), we should update
    return true;
  }
}

export async function createVfsFromRealFs(): Promise<VirtualFileSystem> {
  const root = await getRootDirectoryHandle();
  const rootVirtualFolder = await createVirtualFolderFromRealFs(root, "");
  return new VirtualFileSystem({ root: rootVirtualFolder });
}

async function createVirtualFolderFromRealFs(
  actualFolder: FileSystemDirectoryHandle,
  path: string
): Promise<VirtualFolder> {
  const folder = createVirtualFolder(path.split("/").pop() || "");

  for await (const [name, handle] of actualFolder.entries()) {
    const itemPath = path ? `${path}/${name}` : name;

    if (handle.kind === "file") {
      const fileHandle = await actualFolder.getFileHandle(name);
      const file = await fileHandle.getFile();
      const content = await file.text();
      folder.items[name] = createVirtualFile(
        name,
        content,
        {},
        file.lastModified
      );
    } else if (handle.kind === "directory") {
      const folderHandle = await actualFolder.getDirectoryHandle(name);
      folder.items[name] = await createVirtualFolderFromRealFs(
        folderHandle,
        itemPath
      );
    }
  }

  return folder;
}
