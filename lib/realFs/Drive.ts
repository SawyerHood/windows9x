import { RealFs } from "./RealFs";

export interface StubFile {
  type: "file";
  name: string;
  lastModified: number;
}

export interface SubFolder {
  type: "folder";
  name: string;
}

export type DeepItem = DeepFile | DeepFolder;

export type StubItem = StubFile | SubFolder;

export interface DeepFile extends StubFile {
  content: string | ArrayBuffer;
}

export interface DeepFolder extends SubFolder {
  items: Record<string, DeepItem>;
}

export interface ShallowFolder extends SubFolder {
  items: Record<string, StubItem>;
}

export type Depth = "shallow" | "deep";

export class Drive {
  constructor(private fs: RealFs) {}

  async writeFile(path: string, content: string | ArrayBuffer): Promise<void> {
    await this.fs.createFile(path, content);
  }

  async createFolder(path: string): Promise<void> {
    await this.fs.createFolder(path);
  }

  async delete(path: string): Promise<void> {
    await this.fs.delete(path);
  }

  async getFolder(
    path: string,
    depth: "shallow"
  ): Promise<ShallowFolder | null>;
  async getFolder(path: string, depth: "deep"): Promise<DeepFolder | null>;
  async getFolder(
    path: string,
    depth: Depth = "shallow"
  ): Promise<ShallowFolder | DeepFolder | null> {
    const item = await this.fs.getItem(path);
    if (!item || item.kind !== "directory") return null;

    const dirHandle = item as FileSystemDirectoryHandle;
    const name = path.split("/").pop() || "";

    if (depth === "deep") {
      return this.getDeepFolder(dirHandle, name);
    } else {
      return this.getShallowFolder(dirHandle, name);
    }
  }

  async getFile(path: string, depth: "shallow"): Promise<StubFile | null>;
  async getFile(path: string, depth: "deep"): Promise<DeepFile | null>;
  async getFile(
    path: string,
    depth: Depth = "shallow"
  ): Promise<StubFile | DeepFile | null> {
    const item = await this.fs.getItem(path);
    if (!item || item.kind !== "file") return null;

    const fileHandle = item as FileSystemFileHandle;
    const file = await fileHandle.getFile();
    const name = path.split("/").pop() || "";

    if (depth === "deep") {
      return {
        type: "file",
        name,
        lastModified: file.lastModified,
        content: await file.text(),
      };
    } else {
      return {
        type: "file",
        name,
        lastModified: file.lastModified,
      };
    }
  }

  async insert(path: string, item: DeepFolder | DeepFile): Promise<void> {
    if (item.type === "file") {
      await this.writeFile(path, item.content);
    } else {
      await this.createFolder(path);
      for (const [name, subItem] of Object.entries(item.items)) {
        await this.insert(`${path}/${name}`, subItem);
      }
    }
  }

  async move(oldPath: string, newPath: string): Promise<void> {
    const item = await this.fs.getItem(oldPath);
    if (!item) {
      throw new Error(`Item not found at path: ${oldPath}`);
    }

    if (item.kind === "file") {
      const content = await (
        await (item as FileSystemFileHandle).getFile()
      ).text();
      await this.writeFile(newPath, content);
    } else {
      const folder = await this.getFolder(oldPath, "deep");
      if (folder) {
        await this.insert(newPath, folder);
      }
    }

    await this.delete(oldPath);
  }

  private async getShallowFolder(
    dirHandle: FileSystemDirectoryHandle,
    name: string
  ): Promise<ShallowFolder> {
    const items: Record<string, StubItem> = {};

    for await (const entry of dirHandle.values()) {
      if (entry.kind === "file") {
        const fileHandle = await dirHandle.getFileHandle(entry.name);
        const file = await fileHandle.getFile();
        items[entry.name] = {
          type: "file",
          name: entry.name,
          lastModified: file.lastModified,
        };
      } else {
        items[entry.name] = {
          type: "folder",
          name: entry.name,
        };
      }
    }

    return { type: "folder", name, items };
  }

  private async getDeepFolder(
    dirHandle: FileSystemDirectoryHandle,
    name: string
  ): Promise<DeepFolder> {
    const items: Record<string, DeepItem> = {};

    for await (const entry of dirHandle.values()) {
      if (entry.kind === "file") {
        const fileHandle = await dirHandle.getFileHandle(entry.name);
        const file = await fileHandle.getFile();
        items[entry.name] = {
          type: "file",
          name: entry.name,
          lastModified: file.lastModified,
          content: await file.text(),
        };
      } else {
        const subDirHandle = await dirHandle.getDirectoryHandle(entry.name);
        items[entry.name] = await this.getDeepFolder(subDirHandle, entry.name);
      }
    }

    return { type: "folder", name, items };
  }
}
