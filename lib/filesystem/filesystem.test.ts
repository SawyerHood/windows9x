import { VirtualFileSystem, VirtualFolder } from "./filesystem";

describe("VirtualFileSystem", () => {
  let vfs: VirtualFileSystem;

  beforeEach(() => {
    vfs = new VirtualFileSystem();
  });

  test("should create a file", () => {
    vfs = vfs.createFile("test.txt", "Hello, World!");
    const content = vfs.readFile("test.txt");
    expect(content).toBe("Hello, World!");
  });

  test("should throw error when creating a file that already exists", () => {
    vfs = vfs.createFile("test.txt", "Hello, World!");
    expect(() => vfs.createFile("test.txt")).toThrow(
      'A file or folder with the name "test.txt" already exists in the path "test.txt".'
    );
  });

  test("should update a file", () => {
    vfs = vfs.createFile("test.txt", "Hello, World!");
    vfs = vfs.updateFile("test.txt", "Updated content");
    const content = vfs.readFile("test.txt");
    expect(content).toBe("Updated content");
  });

  test("should delete a file", () => {
    vfs = vfs.createFile("test.txt", "Hello, World!");
    vfs = vfs.deleteFile("test.txt");
    expect(() => vfs.readFile("test.txt")).toThrow(
      'VirtualFile "test.txt" does not exist.'
    );
  });

  test("should create a folder", () => {
    vfs = vfs.createFolder("folder");
    const folders = vfs.listFolders();
    expect(folders).toContain("folder");
  });

  test("should throw error when creating a folder that already exists", () => {
    vfs = vfs.createFolder("folder");
    expect(() => vfs.createFolder("folder")).toThrow(
      'A file or folder with the name "folder" already exists in the path "folder".'
    );
  });

  test("should delete a folder", () => {
    vfs = vfs.createFolder("folder");
    vfs = vfs.deleteFolder("folder");
    expect(() => vfs.getFolder("folder")).toThrow(
      'Folder "folder" does not exist.'
    );
  });

  test("should list files in a folder", () => {
    vfs = vfs.createFolder("folder");
    vfs = vfs.createFile("folder/file1.txt", "Content 1");
    vfs = vfs.createFile("folder/file2.txt", "Content 2");
    const files = vfs.listFiles("folder");
    expect(files).toEqual(["file1.txt", "file2.txt"]);
  });

  test("should list folders in a folder", () => {
    vfs = vfs.createFolder("folder");
    vfs = vfs.createFolder("folder/subfolder1");
    vfs = vfs.createFolder("folder/subfolder2");
    const folders = vfs.listFolders("folder");
    expect(folders).toEqual(["subfolder1", "subfolder2"]);
  });

  test("should throw error when writing to a deeply nested path where some folders don't exist", () => {
    expect(() =>
      vfs.createFile("nonexistent/folder/structure/test.txt", "Content")
    ).toThrow('Folder "nonexistent/folder/structure" does not exist.');
  });

  test("should throw error when reading a file from a deeply nested folder that doesn't exist", () => {
    expect(() => vfs.readFile("nonexistent/folder/structure/test.txt")).toThrow(
      'Folder "nonexistent/folder/structure" does not exist.'
    );
  });

  test("should serialize the filesystem to JSON", () => {
    vfs = vfs.createFolder("folder");
    vfs = vfs.createFile("folder/file1.txt", "Content 1");
    vfs = vfs.createFile("folder/file2.txt", "Content 2");
    const json = vfs.toJSON();
    expect(json).toEqual({
      type: "folder",
      name: "",
      metaData: {},
      items: {
        folder: {
          type: "folder",
          name: "folder",
          metaData: {},
          items: {
            "file1.txt": {
              type: "file",
              name: "file1.txt",
              content: "Content 1",
              metaData: {},
            },
            "file2.txt": {
              type: "file",
              name: "file2.txt",
              content: "Content 2",
              metaData: {},
            },
          },
        },
      },
    });
  });

  test("should deserialize the filesystem from JSON", () => {
    const json: VirtualFolder = {
      type: "folder",
      name: "",
      metaData: {},
      items: {
        folder: {
          type: "folder",
          name: "folder",
          metaData: {},
          items: {
            "file1.txt": {
              type: "file",
              name: "file1.txt",
              content: "Content 1",
              metaData: {},
            },
            "file2.txt": {
              type: "file",
              name: "file2.txt",
              content: "Content 2",
              metaData: {},
            },
          },
        },
      },
    };
    const vfs = VirtualFileSystem.fromJSON(json);
    const folders = vfs.listFolders();
    const files = vfs.listFiles("folder");
    expect(folders).toContain("folder");
    expect(files).toEqual(["file1.txt", "file2.txt"]);
    // No onWrite calls expected during deserialization
  });
});
