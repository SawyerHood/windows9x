import { VirtualFileSystem } from "./filesystem";

export const SYSTEM_PATH = "/system";
export const PROGRAMS_PATH = "/system/programs";
export const REGISTRY_PATH = "/system/registry.reg";

function createDefaultFileSystem(): VirtualFileSystem {
  return new VirtualFileSystem()
    .createFolder(SYSTEM_PATH)
    .createFolder(PROGRAMS_PATH)
    .createFile(REGISTRY_PATH, "{}");
}

export const DEFAULT_FILE_SYSTEM = createDefaultFileSystem();
