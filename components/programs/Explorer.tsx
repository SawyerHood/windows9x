"use client";

import { useEffect, useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import { fileSystemAtom } from "@/state/filesystem";

import { VirtualItem, VirtualFileSystem } from "@/lib/filesystem/filesystem";
import { windowAtomFamily } from "@/state/window";
import { windowsListAtom } from "@/state/windowsList";

import styles from "./Explorer.module.css";
import cx from "classnames";
import { useCreateContextMenu } from "@/state/contextMenu";

export function Explorer({ id }: { id: string }) {
  const createContextMenu = useCreateContextMenu();
  const [state, dispatch] = useAtom(windowAtomFamily(id));
  const [fileSystem, setFileSystem] = useAtom(fileSystemAtom);
  const windowListDispatch = useSetAtom(windowsListAtom);

  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState<string>("");
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);

  if (state.program.type !== "explorer") {
    throw new Error("Program is not explorer");
  }
  const { action, actionText } = state.program;
  const currentPath = state.program.currentPath || "/";
  const [inputPath, setInputPath] = useState(state.program.currentPath || "");

  useEffect(() => {
    setInputPath(currentPath || "/");
  }, [currentPath]);

  const handleDoubleClick = (path: string) => {
    const item = fileSystem.getItem(path);
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

  const handlePathSubmit = () => {
    try {
      fileSystem.getFolder(inputPath);
      dispatch({
        type: "UPDATE_PROGRAM",
        payload: { type: "explorer", currentPath: inputPath },
      });
    } catch {}
  };

  const handleNavigateUp = () => {
    const parentPath = currentPath.split("/").slice(0, -1).join("/");
    try {
      fileSystem.getFolder(parentPath);
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

  const handleNewFolderSubmit = () => {
    if (newFileName.trim() === "") {
      setIsCreatingFolder(false);
      return;
    }
    try {
      const newFolderPath = `${currentPath}/${newFileName}`;
      const newFolder = fileSystem.createFolder(newFolderPath);
      setFileSystem(newFolder);
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

  const renderItems = (items: Record<string, VirtualItem>, path: string) => {
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
              onClick: () => setFileSystem(fileSystem.delete(itemPath)),
            },
          ])}
        >
          <td>{item.type === "folder" ? "📁" : "📄"}</td>
          <td>{item.name}</td>
        </tr>
      );
    });
  };

  const currentFolder = (fileSystem as VirtualFileSystem).getFolder(
    currentPath
  );
  const currentItems = currentFolder ? currentFolder.items : {};

  return (
    <div className={styles.explorer}>
      <div className={styles.actions}>
        <button onClick={handleNavigateUp}>Up</button>
        <button onClick={handleNewFolder}>New Folder</button>
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
