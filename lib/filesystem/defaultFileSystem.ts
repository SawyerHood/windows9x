import { VirtualFileSystem } from "./filesystem";

export const SYSTEM_PATH = "/system";
export const PROGRAMS_PATH = "/system/programs";
export const REGISTRY_PATH = "/system/registry.reg";
export const USER_PATH = "/user";

const metadata = { isSystem: true };

function createDefaultFileSystem(): VirtualFileSystem {
  return new VirtualFileSystem()
    .createFolder(SYSTEM_PATH, metadata)
    .createFolder(PROGRAMS_PATH, metadata)
    .createFolder(USER_PATH, metadata)
    .createFile(REGISTRY_PATH, "{}", metadata);
}

export const DEFAULT_FILE_SYSTEM = createDefaultFileSystem();
