export class VirtualFileSystem {
  private root: VirtualFolder;

  constructor() {
    this.root = new VirtualFolder("");
  }

  createFile(path: string, content: string = ""): void {
    const { parentFolder, name } = this.getParentFolderAndName(path);
    if (parentFolder.files.has(name) || parentFolder.folders.has(name)) {
      throw new Error(
        `A file or folder with the name "${name}" already exists in the path "${path}".`
      );
    }
    parentFolder.files.set(name, new VirtualFile(name, content));
  }

  readFile(path: string): string {
    const file = this.getFile(path);
    return file.content;
  }

  updateFile(path: string, content: string): void {
    const file = this.getFile(path);
    file.content = content;
  }

  deleteFile(path: string): void {
    const { parentFolder, name } = this.getParentFolderAndName(path);
    if (!parentFolder.files.has(name)) {
      throw new Error(`VirtualFile "${path}" does not exist.`);
    }
    parentFolder.files.delete(name);
  }

  createFolder(path: string): void {
    const { parentFolder, name } = this.getParentFolderAndName(path);
    if (parentFolder.files.has(name) || parentFolder.folders.has(name)) {
      throw new Error(
        `A file or folder with the name "${name}" already exists in the path "${path}".`
      );
    }
    parentFolder.folders.set(name, new VirtualFolder(name));
  }

  deleteFolder(path: string): void {
    const { parentFolder, name } = this.getParentFolderAndName(path);
    if (!parentFolder.folders.has(name)) {
      throw new Error(`Folder "${path}" does not exist.`);
    }
    parentFolder.folders.delete(name);
  }

  listFiles(path: string = ""): string[] {
    const folder = this.getFolder(path);
    return Array.from(folder.files.keys());
  }

  listFolders(path: string = ""): string[] {
    const folder = this.getFolder(path);
    return Array.from(folder.folders.keys());
  }

  private getFile(path: string): VirtualFile {
    const { parentFolder, name } = this.getParentFolderAndName(path);
    const file = parentFolder.files.get(name);
    if (!file) {
      throw new Error(`VirtualFile "${path}" does not exist.`);
    }
    return file;
  }

  getFolder(path: string): VirtualFolder {
    const parts = path.split("/").filter(Boolean);
    let currentFolder = this.root;
    for (const part of parts) {
      const nextFolder = currentFolder.folders.get(part);
      if (!nextFolder) {
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

  toJSON(): JSONFolder {
    const serializeFolder = (folder: VirtualFolder): JSONFolder => {
      return {
        name: folder.name,
        files: Array.from(folder.files.entries()).map(([name, file]) => ({
          name: file.name,
          content: file.content,
        })),
        folders: Array.from(folder.folders.entries()).map(([name, subfolder]) =>
          serializeFolder(subfolder)
        ),
      };
    };

    return serializeFolder(this.root);
  }

  fromJSON(data: JSONFolder): void {
    const deserializeFolder = (data: {
      name: string;
      files: { name: string; content: string }[];
      folders: any[];
    }): VirtualFolder => {
      const folder = new VirtualFolder(data.name);
      data.files.forEach((fileData) => {
        folder.files.set(
          fileData.name,
          new VirtualFile(fileData.name, fileData.content)
        );
      });
      data.folders.forEach((subfolderData) => {
        folder.folders.set(
          subfolderData.name,
          deserializeFolder(subfolderData)
        );
      });
      return folder;
    };

    this.root = deserializeFolder(data);
  }
}

export class VirtualFile {
  name: string;
  content: string;

  constructor(name: string, content: string) {
    this.name = name;
    this.content = content;
  }
}

export class VirtualFolder {
  name: string;
  files: Map<string, VirtualFile>;
  folders: Map<string, VirtualFolder>;

  constructor(name: string) {
    this.name = name;
    this.files = new Map();
    this.folders = new Map();
  }
}

type JSONFolder = {
  name: string;
  files: { name: string; content: string }[];
  folders: JSONFolder[];
};
