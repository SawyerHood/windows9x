import { produce, immerable } from "immer";

export type VirtualItem = VirtualFile | VirtualFolder;

export type VirtualFile = {
  type: "file";
  name: string;
  content: string;
  metaData: Record<string, any>;
};

export type VirtualFolder = {
  type: "folder";
  name: string;
  items: Record<string, VirtualItem>;
  metaData: Record<string, any>;
};

export function createVirtualFile(
  name: string,
  content: string,
  metaData: Record<string, any> = {}
): VirtualFile {
  return { type: "file", name, content, metaData };
}

export function createVirtualFolder(
  name: string,
  metaData: Record<string, any> = {}
): VirtualFolder {
  return { type: "folder", name, items: {}, metaData };
}

export class VirtualFileSystem {
  private readonly root: VirtualFolder;

  constructor({ root }: { root?: VirtualFolder } = {}) {
    (this as any)[immerable] = true;
    this.root = root || createVirtualFolder("");
  }

  createOrUpdateFile(
    path: string,
    content: string = "",
    metaData: Record<string, any> = {}
  ): VirtualFileSystem {
    try {
      return this.updateFile(path, content, metaData);
    } catch (error) {
      return this.createFile(path, content, metaData);
    }
  }

  createFile(
    path: string,
    content: string = "",
    metaData: Record<string, any> = {}
  ): VirtualFileSystem {
    return produce(this, (draft: VirtualFileSystem) => {
      const { parentFolder, name } = draft.getParentFolderAndName(path);
      if (parentFolder.items[name]) {
        throw new Error(
          `A file or folder with the name "${name}" already exists in the path "${path}".`
        );
      }
      parentFolder.items[name] = createVirtualFile(name, content, metaData);
    });
  }

  updateFile(
    path: string,
    content: string,
    metaData?: Record<string, any>
  ): VirtualFileSystem {
    return produce(this, (draft: VirtualFileSystem) => {
      const file = draft.getFile(path);
      file.content = content;
      file.metaData = metaData ?? file.metaData;
    });
  }

  delete(path: string): VirtualFileSystem {
    return produce(this, (draft: VirtualFileSystem) => {
      const { parentFolder, name } = draft.getParentFolderAndName(path);
      if (!parentFolder.items[name]) {
        throw new Error(`"${path}" does not exist.`);
      }
      if (parentFolder.items[name].metaData.isSystem) {
        throw new Error(`"${path}" is a system file and cannot be deleted.`);
      }
      delete parentFolder.items[name];
    });
  }

  createFolder(
    path: string,
    metaData: Record<string, any> = {}
  ): VirtualFileSystem {
    return produce(this, (draft: VirtualFileSystem) => {
      const { parentFolder, name } = draft.getParentFolderAndName(path);
      if (parentFolder.items[name]) {
        throw new Error(
          `A file or folder with the name "${name}" already exists in the path "${path}".`
        );
      }
      parentFolder.items[name] = createVirtualFolder(name, metaData);
    });
  }

  readFile(path: string): string {
    const file = this.getFile(path);
    return file.content;
  }

  listItems(path: string = ""): VirtualItem[] {
    const folder = this.getFolder(path);
    return Object.values(folder.items);
  }

  getItem(path: string): VirtualItem | null {
    const { parentFolder, name } = this.getParentFolderAndName(path);
    return parentFolder.items[name] ?? null;
  }

  private getFile(path: string): VirtualFile {
    const { parentFolder, name } = this.getParentFolderAndName(path);
    const file = parentFolder.items[name];
    if (!file || file.type !== "file") {
      throw new Error(`VirtualFile "${path}" does not exist.`);
    }
    return file;
  }

  getFolder(path: string): VirtualFolder {
    const parts = path.split("/").filter(Boolean);
    let currentFolder = this.root;
    for (const part of parts) {
      const nextFolder = currentFolder.items[part];
      if (!nextFolder || nextFolder.type !== "folder") {
        throw new Error(`Folder "${path}" does not exist.`);
      }
      currentFolder = nextFolder;
    }
    return currentFolder;
  }

  exists(path: string): boolean {
    try {
      return this.getItem(path) !== null;
    } catch (error) {
      return false;
    }
  }

  private getParentFolderAndName(path: string): {
    parentFolder: VirtualFolder;
    name: string;
  } {
    const parts = path.split("/").filter(Boolean);
    const name = parts.pop();
    if (!name) {
      throw new Error(`Invalid path "${path}".`);
    }
    const parentFolder = this.getFolder(parts.join("/"));
    return { parentFolder, name };
  }

  toJSON(): VirtualFolder {
    return this.root;
  }

  static fromJSON(data: VirtualFolder): VirtualFileSystem {
    return new VirtualFileSystem({ root: data });
  }
}
