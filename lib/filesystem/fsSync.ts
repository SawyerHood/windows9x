import {
  VirtualFileSystem,
  VirtualFolder,
  VirtualFile,
  createVirtualFolder,
  createVirtualFile,
} from "./filesystem";

export async function isOpfsInitialized(): Promise<boolean> {
  try {
    const root = await navigator.storage.getDirectory();
    await root.getDirectoryHandle("system", { create: false });
    return true;
  } catch (error) {
    return false;
  }
}

export async function syncVfsToOpfs(vfs: VirtualFileSystem): Promise<void> {
  const root = await navigator.storage.getDirectory();
  await syncFolderToOpfs(root, vfs.getFolder(""), "");
}

async function syncFolderToOpfs(
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
      if (await shouldWriteFileToOpfs(fileHandle, item)) {
        const writable = await fileHandle.createWritable();
        await writable.write(item.content);
        await writable.close();
      }
    } else if (item.type === "folder") {
      const folderHandle = await actualFolder.getDirectoryHandle(name, {
        create: true,
      });
      await syncFolderToOpfs(folderHandle, item, itemPath);
    }
  }
}

async function shouldWriteFileToOpfs(
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

export async function createVfsFromOpfs(): Promise<VirtualFileSystem> {
  const root = await navigator.storage.getDirectory();
  const rootVirtualFolder = await createVirtualFolderFromOpfs(root, "");
  return new VirtualFileSystem({ root: rootVirtualFolder });
}

async function createVirtualFolderFromOpfs(
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
      folder.items[name] = await createVirtualFolderFromOpfs(
        folderHandle,
        itemPath
      );
    }
  }

  return folder;
}
