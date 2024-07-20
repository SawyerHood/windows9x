"use client";

import { useEffect, useState, useCallback } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

import { windowAtomFamily } from "@/state/window";
import { windowsListAtom } from "@/state/windowsList";

import styles from "./Explorer.module.css";
import cx from "classnames";
import { useCreateContextMenu } from "@/state/contextMenu";
import up from "@/components/assets/up.ico";
import paste from "@/components/assets/paste.ico";
import newFolder from "@/components/assets/newDir.png";
import Image from "next/image";
import { fsManagerAtom, getFsManager } from "@/lib/filesystem/FsManager";
import { StubItem } from "@/lib/filesystem/Drive";

export function Explorer({ id }: { id: string }) {
  const createContextMenu = useCreateContextMenu();
  const [state, dispatch] = useAtom(windowAtomFamily(id));
  const windowListDispatch = useSetAtom(windowsListAtom);
  const fs = useAtomValue(fsManagerAtom);

  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState<string>("");
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  const [isRenaming, setIsRenaming] = useState<boolean>(false);

  if (state.program.type !== "explorer") {
    throw new Error("Program is not explorer");
  }
  const { action, actionText } = state.program;
  const currentPath = state.program.currentPath || "/";
  const [inputPath, setInputPath] = useState(state.program.currentPath || "");
  const currentFolder = useAtomValue(fs.getFolderAtom(currentPath, "shallow"));

  useEffect(() => {
    setInputPath(currentPath || "/");
  }, [currentPath]);

  const handleDoubleClick = async (path: string) => {
    const fs = await getFsManager();
    const item = await fs.getItem(path, "shallow");
    if (item?.type === "folder") {
      dispatch({
        type: "UPDATE_PROGRAM",
        payload: { type: "explorer", currentPath: path },
      });
    }

    if (item?.type === "file" && action) {
      action(path);
      windowListDispatch({
        type: "REMOVE",
        payload: id,
      });
    }
  };

  const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputPath(e.target.value);
  };

  const handlePathSubmit = async () => {
    try {
      const fs = await getFsManager();
      const folder = await fs.getFolder(inputPath, "shallow");
      if (!folder) {
        return;
      }
      dispatch({
        type: "UPDATE_PROGRAM",
        payload: { type: "explorer", currentPath: inputPath },
      });
    } catch {}
  };

  const handleNavigateUp = async () => {
    const parentPath = currentPath.split("/").slice(0, -1).join("/");
    try {
      const fs = await getFsManager();
      const folder = await fs.getFolder(parentPath, "shallow");
      if (!folder) {
        return;
      }
      dispatch({
        type: "UPDATE_PROGRAM",
        payload: { type: "explorer", currentPath: parentPath },
      });
    } catch {
      alert("Cannot navigate up from the current path");
    }
  };

  const handleFileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewFileName(e.target.value);
  };

  const handleFileSave = () => {
    if (newFileName.trim() === "") {
      alert("File name cannot be empty");
      return;
    }
    action!(`${currentPath}/${newFileName}`);
    // Close this window
    windowListDispatch({
      type: "REMOVE",
      payload: id,
    });
  };

  const handleNewFolder = () => {
    setIsCreatingFolder(true);
    setNewFileName("");
  };

  const handleNewFolderSubmit = async () => {
    if (newFileName.trim() === "") {
      setIsCreatingFolder(false);
      return;
    }
    try {
      const newFolderPath = `${currentPath}/${newFileName}`;
      const fs = await getFsManager();
      await fs.createFolder(newFolderPath);
      setIsCreatingFolder(false);
      setSelectedItem(newFolderPath);
    } catch (error) {
      alert("Failed to create folder");
    }
  };

  const handleClick = (path: string) => {
    setSelectedItem(path);
    setNewFileName(path.split("/").pop() || "");
  };

  const handleRename = (oldPath: string) => {
    setIsRenaming(true);
    setSelectedItem(oldPath);
    setNewFileName(oldPath.split("/").pop() || "");
  };

  const handleRenameSubmit = async () => {
    if (
      newFileName.trim() === "" ||
      newFileName === selectedItem?.split("/").pop()
    ) {
      setIsRenaming(false);
      return;
    }
    try {
      const oldPath = selectedItem!;
      const newPath = `${currentPath}/${newFileName}`;
      const fs = await getFsManager();
      await fs.move(oldPath, newPath);
      setIsRenaming(false);
      setSelectedItem(newPath);
    } catch (error) {
      alert("Failed to rename item");
    }
  };

  const handleCopy = useCallback(async (path: string) => {
    try {
      const fs = await getFsManager();
      const item = await fs.getItem(path, "deep");
      if (item) {
        await navigator.clipboard.writeText(
          JSON.stringify({ action: "copy", item })
        );
      }
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  }, []);

  const handleCut = useCallback(async (path: string) => {
    try {
      const fs = await getFsManager();
      const item = await fs.getItem(path, "deep");
      if (item) {
        await navigator.clipboard.writeText(
          JSON.stringify({ action: "cut", item })
        );
        await fs.delete(path);
      }
    } catch (error) {
      console.error("Failed to cut to clipboard:", error);
    }
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const clipboardContent = await navigator.clipboard.readText();
      const { action, item } = JSON.parse(clipboardContent);

      let newPath = `${currentPath}/${item.name}`;
      let counter = 1;

      const fs = await getFsManager();

      while (await fs.getItem(newPath, "shallow")) {
        const nameParts = item.name.split(".");
        if (nameParts.length > 1) {
          const extension = nameParts.pop();
          newPath = `${currentPath}/${nameParts.join(
            "."
          )}_${counter}.${extension}`;
        } else {
          newPath = `${currentPath}/${item.name}_${counter}`;
        }
        counter++;
      }

      if (action === "copy" || action === "cut") {
        await fs.insert(newPath, item);
      }
    } catch (error) {
      console.error("Failed to paste from clipboard:", error);
      alert("Failed to paste item");
    }
  }, [currentPath]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "c":
            if (selectedItem) handleCopy(selectedItem);
            break;
          case "x":
            if (selectedItem) handleCut(selectedItem);
            break;
          case "v":
            handlePaste();
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItem, handleCopy, handleCut, handlePaste]);

  const renderItems = (items: Record<string, StubItem>, path: string) => {
    return Object.keys(items).map((key) => {
      const item = items[key];
      const itemPath = `${path}/${item.name}`.replace("//", "/");
      return (
        <tr
          key={key}
          onDoubleClick={() => handleDoubleClick(itemPath)}
          className={cx({ highlighted: selectedItem === itemPath })}
          onClick={() => handleClick(itemPath)}
          onContextMenu={createContextMenu([
            {
              label: "Delete",
              onClick: async () => {
                const fs = await getFsManager();
                await fs.delete(itemPath);
              },
            },
            {
              label: "Rename",
              onClick: () => handleRename(itemPath),
            },
            {
              label: "Copy",
              onClick: () => handleCopy(itemPath),
            },
            {
              label: "Cut",
              onClick: () => handleCut(itemPath),
            },
          ])}
        >
          <td>{item.type === "folder" ? "📁" : "📄"}</td>
          <td>
            {isRenaming && selectedItem === itemPath ? (
              <input
                type="text"
                value={newFileName}
                onChange={handleFileNameChange}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRenameSubmit();
                  }
                }}
                autoFocus
              />
            ) : (
              item.name
            )}
          </td>
        </tr>
      );
    });
  };

  const currentItems = currentFolder ? currentFolder.items : {};

  return (
    <div className={styles.explorer}>
      <div className={styles.actions}>
        <button onClick={handleNavigateUp}>
          <Image src={up} alt="Up" />
          <span>Up</span>
        </button>
        <button onClick={handleNewFolder}>
          <Image src={newFolder} alt="New Folder" />
          <span>New Folder</span>
        </button>
        <button onClick={handlePaste}>
          <Image src={paste} alt="Paste" />
          <span>Paste</span>
        </button>
      </div>
      <div className={styles.pathBar}>
        <label>Address:</label>
        <input
          type="text"
          value={inputPath}
          onChange={handlePathChange}
          onBlur={handlePathSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handlePathSubmit();
            }
          }}
        />
      </div>
      <div className={cx("sunken-panel", styles.tableWrapper)}>
        <table className="interactive">
          <thead>
            <tr>
              <th>Type</th>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {renderItems(currentItems, currentPath)}
            {isCreatingFolder && (
              <tr>
                <td>📁</td>
                <td>
                  <input
                    type="text"
                    value={newFileName}
                    onChange={handleFileNameChange}
                    onBlur={handleNewFolderSubmit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleNewFolderSubmit();
                      }
                    }}
                    autoFocus
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {action && (
        <div className={styles.saveSection}>
          <label>File Name:</label>
          <input
            type="text"
            value={newFileName}
            onChange={handleFileNameChange}
          />
          <button onClick={handleFileSave}>{actionText}</button>
        </div>
      )}
    </div>
  );
}
