import { FsManager } from "../FsManager";
import { getOriginPrivateDirectory } from "file-system-access";
import {
  SYSTEM_PATH,
  PROGRAMS_PATH,
  USER_PATH,
  REGISTRY_PATH,
} from "../defaultFileSystem";
import { DeepFile } from "../Drive";
import { filterOutKey } from "./filterOutKey";

async function getNodeDirectoryHandle() {
  return getOriginPrivateDirectory(
    import("file-system-access/lib/adapters/memory.js")
  );
}

describe("FsManager", () => {
  let fsManager: FsManager;

  beforeEach(async () => {
    const handle = await getNodeDirectoryHandle();
    fsManager = new FsManager(handle);
  });

  describe("setupDefaultDirectories", () => {
    it("should create default directories and registry file", async () => {
      await fsManager.setupDefaultDirectories();

      const systemFolder = await fsManager.getFolder(SYSTEM_PATH, "shallow");
      const programsFolder = await fsManager.getFolder(
        PROGRAMS_PATH,
        "shallow"
      );
      const userFolder = await fsManager.getFolder(USER_PATH, "shallow");
      const registryFile = await fsManager.getFile(REGISTRY_PATH, "deep");

      expect(systemFolder).not.toBeNull();
      expect(programsFolder).not.toBeNull();
      expect(userFolder).not.toBeNull();
      expect(registryFile).not.toBeNull();
      expect(registryFile?.content).toBe("{}");
    });
  });

  describe("writeFile and getFile", () => {
    it("should write and read a file", async () => {
      const path = "/test.txt";
      const content = "Hello, world!";

      await fsManager.writeFile(path, content);
      const file = await fsManager.getFile(path, "deep");

      expect(file).not.toBeNull();
      expect(file?.content).toBe(content);
    });
  });

  describe("createFolder and getFolder", () => {
    it("should create and retrieve a folder", async () => {
      const path = "/testFolder";

      await fsManager.createFolder(path);
      const folder = await fsManager.getFolder(path, "shallow");

      expect(folder).not.toBeNull();
      expect(folder?.name).toBe("testFolder");
    });
  });

  describe("delete", () => {
    it("should delete a file", async () => {
      const path = "/fileToDelete.txt";
      await fsManager.writeFile(path, "content");

      await fsManager.delete(path);
      const file = await fsManager.getFile(path, "shallow");

      expect(file).toBeNull();
    });

    it("should delete a folder", async () => {
      const path = "/folderToDelete";
      await fsManager.createFolder(path);

      await fsManager.delete(path);
      const folder = await fsManager.getFolder(path, "shallow");

      expect(folder).toBeNull();
    });
  });

  describe("move", () => {
    it("should move a file", async () => {
      const oldPath = "/oldFile.txt";
      const newPath = "/newFile.txt";
      await fsManager.writeFile(oldPath, "content");

      await fsManager.move(oldPath, newPath);
      const oldFile = await fsManager.getFile(oldPath, "shallow");
      const newFile = await fsManager.getFile(newPath, "deep");

      expect(oldFile).toBeNull();
      expect(newFile).not.toBeNull();
      expect(newFile?.content).toBe("content");
    });
  });

  describe("insert", () => {
    it("should insert a file", async () => {
      const path = "/insertedFile.txt";
      const file = {
        type: "file" as const,
        name: "insertedFile.txt",
        lastModified: Date.now(),
        content: "Inserted content",
      };

      await fsManager.insert(path, file);
      const retrievedFile = await fsManager.getFile(path, "deep");

      expect(retrievedFile).toMatchObject(filterOutKey(file, "lastModified"));
    });
  });

  describe("mountDrive and unmountDrive", () => {
    it("should mount and unmount a drive", async () => {
      const driveName = "testDrive";
      const mountPath = `/mnt/${driveName}`;
      const handle = await getNodeDirectoryHandle();

      await fsManager.mountDrive(driveName, handle);
      const mountedFolder = await fsManager.getFolder(mountPath, "shallow");
      expect(mountedFolder).not.toBeNull();

      await fsManager.unmountDrive(driveName);
      const unmountedFolder = await fsManager.getFolder(mountPath, "shallow");
      expect(unmountedFolder).toBeNull();
    });

    it("should throw an error when mounting a drive with an existing name", async () => {
      const driveName = "existingDrive";
      const handle = await getNodeDirectoryHandle();

      await fsManager.mountDrive(driveName, handle);
      await expect(fsManager.mountDrive(driveName, handle)).rejects.toThrow();
    });

    it("should throw an error when unmounting a non-existent drive", async () => {
      await expect(
        fsManager.unmountDrive("nonExistentDrive")
      ).rejects.toThrow();
    });
  });

  describe("getItem", () => {
    it("should retrieve a file as an item", async () => {
      const path = "/itemFile.txt";
      const content = "Item file content";
      await fsManager.writeFile(path, content);

      const item = await fsManager.getItem(path, "deep");
      expect(item).not.toBeNull();
      expect(item?.type).toBe("file");
      expect((item as DeepFile).content).toBe(content);
    });

    it("should retrieve a folder as an item", async () => {
      const path = "/itemFolder";
      await fsManager.createFolder(path);

      const item = await fsManager.getItem(path, "shallow");
      expect(item).not.toBeNull();
      expect(item?.type).toBe("folder");
      expect(item?.name).toBe("itemFolder");
    });
  });

  describe("hasSystemData", () => {
    it("should return true when system folder exists", async () => {
      await fsManager.setupDefaultDirectories();
      const hasData = await fsManager.hasSystemData();
      expect(hasData).toBe(true);
    });

    it("should return false when system folder doesn't exist", async () => {
      await fsManager.delete(SYSTEM_PATH);
      const hasData = await fsManager.hasSystemData();
      expect(hasData).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle deep nested paths", async () => {
      const deepPath = "/deep/nested/folder/structure";
      await fsManager.createFolder(deepPath);

      const folder = await fsManager.getFolder(deepPath, "shallow");
      expect(folder).not.toBeNull();
      expect(folder?.name).toBe("structure");
    });

    it("should handle file names with special characters", async () => {
      const specialPath = "/special!@#$%^&*()_+.txt";
      const content = "Special content";
      await fsManager.writeFile(specialPath, content);

      const file = await fsManager.getFile(specialPath, "deep");
      expect(file).not.toBeNull();
      expect(file?.content).toBe(content);
    });

    it("should handle empty files", async () => {
      const emptyPath = "/empty.txt";
      await fsManager.writeFile(emptyPath, "");

      const file = await fsManager.getFile(emptyPath, "deep");
      expect(file).not.toBeNull();
      expect(file?.content).toBe("");
    });

    it("should handle moving files between folders", async () => {
      const sourcePath = "/sourceFolder/moveFile.txt";
      const destPath = "/destFolder/movedFile.txt";
      const content = "Move me";

      await fsManager.createFolder("/sourceFolder");
      await fsManager.createFolder("/destFolder");
      await fsManager.writeFile(sourcePath, content);

      await fsManager.move(sourcePath, destPath);

      const sourceFile = await fsManager.getFile(sourcePath, "shallow");
      const destFile = await fsManager.getFile(destPath, "deep");

      expect(sourceFile).toBeNull();
      expect(destFile).not.toBeNull();
      expect(destFile?.content).toBe(content);
    });
  });

  describe("operations with mounted paths", () => {
    const driveName = "testDrive";
    const mountPath = `/mnt/${driveName}`;

    beforeEach(async () => {
      const handle = await getNodeDirectoryHandle();
      await fsManager.mountDrive(driveName, handle);
    });

    afterEach(async () => {
      await fsManager.unmountDrive(driveName);
    });

    it("should write and read a file in a mounted drive", async () => {
      const path = `${mountPath}/test.txt`;
      const content = "Hello, mounted world!";

      await fsManager.writeFile(path, content);
      const file = await fsManager.getFile(path, "deep");

      expect(file).not.toBeNull();
      expect(file?.content).toBe(content);
    });

    it("should create and retrieve a folder in a mounted drive", async () => {
      const path = `${mountPath}/testFolder`;

      await fsManager.createFolder(path);
      const folder = await fsManager.getFolder(path, "shallow");

      expect(folder).not.toBeNull();
      expect(folder?.name).toBe("testFolder");
    });

    it("should delete a file in a mounted drive", async () => {
      const path = `${mountPath}/fileToDelete.txt`;
      await fsManager.writeFile(path, "content");

      await fsManager.delete(path);
      const file = await fsManager.getFile(path, "shallow");

      expect(file).toBeNull();
    });

    it("should move a file within a mounted drive", async () => {
      const oldPath = `${mountPath}/oldFile.txt`;
      const newPath = `${mountPath}/newFile.txt`;
      await fsManager.writeFile(oldPath, "content");

      await fsManager.move(oldPath, newPath);
      const oldFile = await fsManager.getFile(oldPath, "shallow");
      const newFile = await fsManager.getFile(newPath, "deep");

      expect(oldFile).toBeNull();
      expect(newFile).not.toBeNull();
      expect(newFile?.content).toBe("content");
    });

    it("should insert a file in a mounted drive", async () => {
      const path = `${mountPath}/insertedFile.txt`;
      const file = {
        type: "file" as const,
        name: "insertedFile.txt",
        lastModified: Date.now(),
        content: "Inserted content in mounted drive",
      };

      await fsManager.insert(path, file);
      const retrievedFile = await fsManager.getFile(path, "deep");

      expect(retrievedFile).toMatchObject(filterOutKey(file, "lastModified"));
    });

    it("should retrieve an item from a mounted drive", async () => {
      const path = `${mountPath}/itemFile.txt`;
      const content = "Item file content in mounted drive";
      await fsManager.writeFile(path, content);

      const item = await fsManager.getItem(path, "deep");
      expect(item).not.toBeNull();
      expect(item?.type).toBe("file");
      expect((item as DeepFile).content).toBe(content);
    });

    it("should handle deep nested paths in a mounted drive", async () => {
      const deepPath = `${mountPath}/deep/nested/folder/structure`;
      await fsManager.createFolder(deepPath);

      const folder = await fsManager.getFolder(deepPath, "shallow");
      expect(folder).not.toBeNull();
      expect(folder?.name).toBe("structure");
    });
  });
});
