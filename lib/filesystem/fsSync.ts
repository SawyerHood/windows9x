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

// Maybe don't ever do deletes when we sync to real fs. Flush these separately using tombstones.
// Also maybe track newly created files.

export async function syncVfsToRealFs(
  vfs: VirtualFileSystem
): Promise<VirtualFileSystem> {
  const root = await getRootDirectoryHandle();
  const updatedRootFolder = await syncFolderToRealFs(
    root,
    vfs.getFolder(""),
    ""
  );
  return new VirtualFileSystem({ root: updatedRootFolder });
}

async function syncFolderToRealFs(
  actualFolder: FileSystemDirectoryHandle,
  virtualFolder: VirtualFolder,
  path: string
): Promise<VirtualFolder> {
  const updatedFolder = createVirtualFolder(virtualFolder.name);

  const childNames = new Set();
  // Delete items that are not in the virtual filesystem
  for await (const [name] of actualFolder.entries()) {
    childNames.add(name);
    // if (!virtualFolder.items[name]) {
    //   childNames.delete(name);
    //   await actualFolder.removeEntry(name, { recursive: true });
    // }
  }

  // Add or update items from the virtual filesystem
  for (const [name, item] of Object.entries(virtualFolder.items)) {
    const itemPath = path ? `${path}/${name}` : name;

    if (item.type === "file") {
      const needToCreate = !childNames.has(name);
      const fileHandle = await actualFolder.getFileHandle(name, {
        create: true,
      });
      const updatedFile = await syncFileToRealFs(
        fileHandle,
        item as VirtualFile,
        needToCreate
      );
      updatedFolder.items[name] = updatedFile;
    } else if (item.type === "folder") {
      const folderHandle = await actualFolder.getDirectoryHandle(name, {
        create: true,
      });
      updatedFolder.items[name] = await syncFolderToRealFs(
        folderHandle,
        item as VirtualFolder,
        itemPath
      );
    }
  }

  return updatedFolder;
}

async function syncFileToRealFs(
  fileHandle: FileSystemFileHandle,
  virtualFile: VirtualFile,
  shouldCreate: boolean
): Promise<VirtualFile> {
  if (
    shouldCreate ||
    (await shouldWriteFileToRealFs(fileHandle, virtualFile))
  ) {
    const writable = await fileHandle.createWritable();
    await writable.write(virtualFile.content);
    await writable.close();
  }

  const file = await fileHandle.getFile();
  return createVirtualFile(
    virtualFile.name,
    virtualFile.content,
    virtualFile.metaData,
    file.lastModified
  );
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

export async function updateVfsFromRealFs(
  vfs: VirtualFileSystem
): Promise<VirtualFileSystem> {
  const root = await getRootDirectoryHandle();
  const updatedRootFolder = await updateFolderFromRealFs(
    root,
    vfs.getFolder(""),
    ""
  );
  return new VirtualFileSystem({ root: updatedRootFolder });
}

async function updateFolderFromRealFs(
  actualFolder: FileSystemDirectoryHandle,
  virtualFolder: VirtualFolder,
  path: string
): Promise<VirtualFolder> {
  const updatedFolder = createVirtualFolder(virtualFolder.name);
  const existingItems = new Set(Object.keys(virtualFolder.items));

  for await (const [name, handle] of actualFolder.entries()) {
    const itemPath = path ? `${path}/${name}` : name;
    existingItems.delete(name);

    if (handle.kind === "file") {
      const fileHandle = await actualFolder.getFileHandle(name);
      updatedFolder.items[name] = await updateFileFromRealFs(
        fileHandle,
        virtualFolder.items[name] as VirtualFile | undefined
      );
    } else if (handle.kind === "directory") {
      const folderHandle = await actualFolder.getDirectoryHandle(name);
      updatedFolder.items[name] = await updateFolderFromRealFs(
        folderHandle,
        (virtualFolder.items[name] as VirtualFolder) ||
          createVirtualFolder(name),
        itemPath
      );
    }
  }

  //   // Remove items that no longer exist in the real filesystem
  //   existingItems.forEach((itemName) => {
  //     delete updatedFolder.items[itemName];
  //   });

  return updatedFolder;
}

async function updateFileFromRealFs(
  fileHandle: FileSystemFileHandle,
  virtualFile?: VirtualFile
): Promise<VirtualFile> {
  const file = await fileHandle.getFile();
  const actualLastModified = file.lastModified;
  console.log("actualLastModified", actualLastModified);
  console.log("virtualFile", virtualFile);
  if (!virtualFile || actualLastModified > virtualFile.lastModified) {
    const content = await file.text();
    return createVirtualFile(
      file.name,
      content,
      virtualFile?.metaData || {},
      actualLastModified
    );
  }

  return virtualFile;
}
