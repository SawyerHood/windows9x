import { DeepFile, DeepFolder, Drive } from "../Drive";
import { RealFs } from "../RealFs";
import { getOriginPrivateDirectory } from "file-system-access";

async function getNodeDirectoryHandle() {
  return getOriginPrivateDirectory(
    import("file-system-access/lib/adapters/memory.js")
  );
}

describe("Drive", () => {
  let drive: Drive;
  let realFs: RealFs;

  beforeEach(async () => {
    realFs = new RealFs(await getNodeDirectoryHandle());
    drive = new Drive(realFs);
  });

  describe("writeFile", () => {
    it("should write a file", async () => {
      await drive.writeFile("test.txt", "content");
      const file = await drive.getFile("test.txt", "deep");
      expect(file).toEqual({
        type: "file",
        name: "test.txt",
        lastModified: expect.any(Number),
        content: "content",
      });
    });
  });

  describe("createFolder", () => {
    it("should create a folder", async () => {
      await drive.createFolder("testFolder");
      const folder = await drive.getFolder("testFolder", "shallow");
      expect(folder).toEqual({
        type: "folder",
        name: "testFolder",
        items: {},
      });
    });
  });

  describe("delete", () => {
    it("should delete a file", async () => {
      await drive.writeFile("toDelete.txt", "content");
      await drive.delete("toDelete.txt");
      const file = await drive.getFile("toDelete.txt", "shallow");
      expect(file).toBeNull();
    });

    it("should delete a folder", async () => {
      await drive.createFolder("toDeleteFolder");
      await drive.delete("toDeleteFolder");
      const folder = await drive.getFolder("toDeleteFolder", "shallow");
      expect(folder).toBeNull();
    });
  });

  describe("getFolder", () => {
    it("should return null if folder is not found", async () => {
      const result = await drive.getFolder("nonexistent", "shallow");
      expect(result).toBeNull();
    });

    it("should return a shallow folder structure", async () => {
      await drive.createFolder("testFolder");
      await drive.writeFile("testFolder/file1.txt", "content1");
      await drive.createFolder("testFolder/subdir");

      const result = await drive.getFolder("testFolder", "shallow");
      expect(result).toEqual({
        type: "folder",
        name: "testFolder",
        items: {
          "file1.txt": {
            type: "file",
            name: "file1.txt",
            lastModified: expect.any(Number),
          },
          subdir: { type: "folder", name: "subdir" },
        },
      });
    });

    it("should return a deep folder structure", async () => {
      await drive.createFolder("testFolder");
      await drive.writeFile("testFolder/file1.txt", "content1");
      await drive.createFolder("testFolder/subdir");
      await drive.writeFile("testFolder/subdir/file2.txt", "content2");

      const result = await drive.getFolder("testFolder", "deep");
      expect(result).toEqual({
        type: "folder",
        name: "testFolder",
        items: {
          "file1.txt": {
            type: "file",
            name: "file1.txt",
            lastModified: expect.any(Number),
            content: "content1",
          },
          subdir: {
            type: "folder",
            name: "subdir",
            items: {
              "file2.txt": {
                type: "file",
                name: "file2.txt",
                lastModified: expect.any(Number),
                content: "content2",
              },
            },
          },
        },
      });
    });
  });

  describe("getFile", () => {
    it("should return null if file is not found", async () => {
      const result = await drive.getFile("nonexistent.txt", "shallow");
      expect(result).toBeNull();
    });

    it("should return a shallow file structure", async () => {
      await drive.writeFile("test.txt", "content");
      const result = await drive.getFile("test.txt", "shallow");
      expect(result).toEqual({
        type: "file",
        name: "test.txt",
        lastModified: expect.any(Number),
      });
    });

    it("should return a deep file structure", async () => {
      await drive.writeFile("test.txt", "file content");
      const result = await drive.getFile("test.txt", "deep");
      expect(result).toEqual({
        type: "file",
        name: "test.txt",
        lastModified: expect.any(Number),
        content: "file content",
      });
    });
  });

  describe("insert", () => {
    it("should insert a file", async () => {
      const file: DeepFile = {
        type: "file",
        name: "inserted.txt",
        lastModified: Date.now(),
        content: "inserted content",
      };
      await drive.insert("inserted.txt", file);
      const result = await drive.getFile("inserted.txt", "deep");
      expect(result).toEqual(file);
    });

    it("should insert a folder structure", async () => {
      const folder: DeepFolder = {
        type: "folder",
        name: "insertedFolder",
        items: {
          "file1.txt": {
            type: "file",
            name: "file1.txt",
            lastModified: Date.now(),
            content: "content1",
          },
          subdir: {
            type: "folder",
            name: "subdir",
            items: {
              "file2.txt": {
                type: "file",
                name: "file2.txt",
                lastModified: Date.now(),
                content: "content2",
              },
            },
          },
        },
      };
      await drive.insert("insertedFolder", folder);

      const result = await drive.getFolder("insertedFolder", "deep");
      expect(result).toMatchObject(filterOutKey(folder, "lastModified"));
    });
  });

  describe("move", () => {
    it("should move a file", async () => {
      await drive.writeFile("source.txt", "content");
      await drive.move("source.txt", "destination.txt");
      const sourceFile = await drive.getFile("source.txt", "shallow");
      const destFile = await drive.getFile("destination.txt", "deep");
      expect(sourceFile).toBeNull();
      expect(destFile).toEqual({
        type: "file",
        name: "destination.txt",
        lastModified: expect.any(Number),
        content: "content",
      });
    });

    it("should move a folder", async () => {
      await drive.createFolder("sourceFolder");
      await drive.writeFile("sourceFolder/file.txt", "content");
      await drive.move("sourceFolder", "destFolder");
      const sourceFolder = await drive.getFolder("sourceFolder", "shallow");
      const destFolder = await drive.getFolder("destFolder", "deep");
      expect(sourceFolder).toBeNull();
      expect(destFolder).toEqual({
        type: "folder",
        name: "destFolder",
        items: {
          "file.txt": {
            type: "file",
            name: "file.txt",
            lastModified: expect.any(Number),
            content: "content",
          },
        },
      });
    });
  });
});

// Helper function to recursively filter out a key from all objects
function filterOutKey(obj: any, keyToFilter: string): any {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => filterOutKey(item, keyToFilter));
  }

  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (key !== keyToFilter) {
      acc[key] = filterOutKey(value, keyToFilter);
    }
    return acc;
  }, {} as any);
}

describe("filterOutKey", () => {
  it("should remove the specified key from nested objects", () => {
    const input = {
      name: "John",
      age: 30,
      address: {
        street: "123 Main St",
        city: "New York",
        country: "USA",
        coordinates: {
          lat: 40.7128,
          long: 74.006,
          accuracy: 100,
        },
      },
      hobbies: [
        "reading",
        "swimming",
        { name: "cycling", frequency: "weekly" },
      ],
    };

    const expected = {
      name: "John",
      address: {
        street: "123 Main St",
        city: "New York",
        country: "USA",
        coordinates: {
          lat: 40.7128,
          long: 74.006,
          accuracy: 100,
        },
      },
      hobbies: [
        "reading",
        "swimming",
        { name: "cycling", frequency: "weekly" },
      ],
    };

    const result = filterOutKey(input, "age");
    expect(result).toEqual(expected);
  });

  it("should handle arrays and nested arrays", () => {
    const input = [
      { id: 1, name: "Item 1" },
      { id: 2, name: "Item 2", subItems: [{ id: 3, name: "Subitem 3" }] },
    ];

    const expected = [
      { name: "Item 1" },
      { name: "Item 2", subItems: [{ name: "Subitem 3" }] },
    ];

    const result = filterOutKey(input, "id");
    expect(result).toEqual(expected);
  });

  it("should return primitive values unchanged", () => {
    expect(filterOutKey(42, "any")).toBe(42);
    expect(filterOutKey("hello", "any")).toBe("hello");
    expect(filterOutKey(null, "any")).toBeNull();
    expect(filterOutKey(undefined, "any")).toBeUndefined();
  });
});
