import { readFileAsText } from "./readFileAsText";

export class RealFs {
  root: FileSystemDirectoryHandle;

  constructor(root: FileSystemDirectoryHandle) {
    this.root = root;
  }

  async getItem(path: string): Promise<FileSystemHandle | null> {
    const parts = path.split("/").filter(Boolean);
    let current: FileSystemDirectoryHandle = this.root;

    for (const part of parts) {
      try {
        current = await current.getDirectoryHandle(part);
      } catch {
        try {
          return await current.getFileHandle(part);
        } catch {
          return null;
        }
      }
    }

    return current;
  }

  async createFile(path: string, content: string | ArrayBuffer): Promise<void> {
    const parts = path.split("/").filter(Boolean);
    const fileName = parts.pop();
    if (!fileName) throw new Error("Invalid path");

    const parentDir = await this.ensureDirectory(parts.join("/"));
    const file = await parentDir.getFileHandle(fileName, { create: true });
    const writable = await file.createWritable();
    try {
      await writable.write(content);
    } catch (e) {
      console.error(e);
    }
    await writable.close();
  }

  async readFile(path: string): Promise<string> {
    const file = await this.getItem(path);
    if (!file || file.kind !== "file") throw new Error("File not found");
    const fileHandle = file as FileSystemFileHandle;
    const fileData = await fileHandle.getFile();
    return await readFileAsText(fileData);
  }

  async delete(path: string): Promise<void> {
    const parts = path.split("/").filter(Boolean);
    const itemName = parts.pop();
    if (!itemName) throw new Error("Invalid path");

    const parentDir = await this.getItem(parts.join("/"));
    if (!parentDir || parentDir.kind !== "directory")
      throw new Error("Parent directory not found");

    await (parentDir as FileSystemDirectoryHandle).removeEntry(itemName, {
      recursive: true,
    });
  }

  async createFolder(path: string): Promise<void> {
    await this.ensureDirectory(path);
  }

  private async ensureDirectory(
    path: string
  ): Promise<FileSystemDirectoryHandle> {
    const parts = path.split("/").filter(Boolean);
    let current = this.root;

    for (const part of parts) {
      current = await current.getDirectoryHandle(part, { create: true });
    }

    return current;
  }
}
