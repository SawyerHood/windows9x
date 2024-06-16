export type VirtualItem = VirtualFile | VirtualFolder;

export type VirtualFile = {
  type: "file";
  name: string;
  content: string;
};

export type VirtualFolder = {
  type: "folder";
  name: string;
  items: Record<string, VirtualItem>;
};

export function createVirtualFile(name: string, content: string): VirtualFile {
  return { type: "file", name, content };
}

export function createVirtualFolder(name: string): VirtualFolder {
  return { type: "folder", name, items: {} };
}

export class VirtualFileSystem {
  private root: VirtualFolder;
  private onWrite: () => void = () => {};

  constructor({
    root,
    onWrite,
  }: { root?: VirtualFolder; onWrite?: () => void } = {}) {
    this.root = root || createVirtualFolder("");
    this.onWrite = onWrite || (() => {});
  }

  flush() {
    this.onWrite();
  }

  //   @mutates
  createFile(path: string, content: string = ""): void {
    const { parentFolder, name } = this.getParentFolderAndName(path);
    if (parentFolder.items[name]) {
      throw new Error(
        `A file or folder with the name "${name}" already exists in the path "${path}".`
      );
    }
    parentFolder.items[name] = createVirtualFile(name, content);
    this.flush();
  }

  //   @mutates
  updateFile(path: string, content: string): void {
    const file = this.getFile(path);
    file.content = content;
    this.flush();
  }

  //   @mutates
  deleteFile(path: string): void {
    const { parentFolder, name } = this.getParentFolderAndName(path);
    if (!parentFolder.items[name] || parentFolder.items[name].type !== "file") {
      throw new Error(`VirtualFile "${path}" does not exist.`);
    }
    delete parentFolder.items[name];
    this.flush();
  }

  //   @mutates
  createFolder(path: string): void {
    const { parentFolder, name } = this.getParentFolderAndName(path);
    if (parentFolder.items[name]) {
      throw new Error(
        `A file or folder with the name "${name}" already exists in the path "${path}".`
      );
    }
    parentFolder.items[name] = createVirtualFolder(name);
    this.flush();
  }

  //   @mutates
  deleteFolder(path: string): void {
    const { parentFolder, name } = this.getParentFolderAndName(path);
    if (
      !parentFolder.items[name] ||
      parentFolder.items[name].type !== "folder"
    ) {
      throw new Error(`Folder "${path}" does not exist.`);
    }
    delete parentFolder.items[name];
    this.flush();
  }

  readFile(path: string): string {
    const file = this.getFile(path);
    return file.content;
  }

  listFiles(path: string = ""): string[] {
    const folder = this.getFolder(path);
    return Object.keys(folder.items).filter(
      (key) => folder.items[key].type === "file"
    );
  }

  listFolders(path: string = ""): string[] {
    const folder = this.getFolder(path);
    return Object.keys(folder.items).filter(
      (key) => folder.items[key].type === "folder"
    );
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

// function mutates(originalMethod: any, _: any) {
//   return function (this: VirtualFileSystem, ...args: any[]) {
//     const result = originalMethod.apply(this, args);
//     this.flush();
//     return result;
//   };
// }
