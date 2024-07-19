import { DeepFolder, DeepItem } from "./Drive";

type VirtualItem = VirtualFile | VirtualFolder;

type VirtualFile = {
  type: "file";
  name: string;
  content: string;
  metaData: Record<string, any>;
};

type VirtualFolder = {
  type: "folder";
  name: string;
  items: Record<string, VirtualItem>;
  metaData: Record<string, any>;
};

const KEY = "filesystem";

export function getOldFormat(): DeepFolder | null {
  const storedData = localStorage.getItem(KEY);
  if (!storedData) {
    return null;
  }

  try {
    const parsedData: { root: VirtualFolder; migrated?: boolean } | null =
      JSON.parse(storedData);
    if (parsedData && parsedData.root && !parsedData.migrated) {
      // Mark the data as migrated
      parsedData.migrated = true;

      // Rewrite the updated data to local storage
      localStorage.setItem(KEY, JSON.stringify(parsedData));

      return upgradeVirtualItem(parsedData.root) as DeepFolder;
    }
  } catch (error) {
    console.error("Error parsing stored filesystem data:", error);
  }

  return null;
}

function upgradeVirtualItem(item: VirtualItem): DeepItem {
  if (item.type === "file") {
    return {
      type: "file",
      name: item.name,
      content: item.content,
      lastModified: Date.now(),
    };
  }

  return {
    type: "folder",
    name: item.name,
    items: Object.fromEntries(
      Object.entries(item.items).map(([name, item]) => [
        name,
        upgradeVirtualItem(item),
      ])
    ),
  };
}
