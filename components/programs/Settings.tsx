"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { settingsAtom } from "@/state/settings";
import { windowsListAtom } from "@/state/windowsList";
import {
  isRootDirectorySetAtom,
  rootDirectoryHandleAtom,
} from "@/lib/filesystem/directoryMapping";
import styles from "./Settings.module.css";
import cx from "classnames";
import { ModelSection } from "../ModelSection";
import { useFlags } from "@/flags/context";
import { supportsDirectoryPicker } from "@/lib/supportsDirectoryPicker";

export function Settings({ id }: { id: string }) {
  const [settings, setSettings] = useAtom(settingsAtom);
  const windowsDispatch = useSetAtom(windowsListAtom);
  const flags = useFlags();

  const onSave = () => {
    windowsDispatch({ type: "REMOVE", payload: id });
  };

  return (
    <div className={styles.body}>
      <fieldset>
        <legend>Custom API Key</legend>
        <div className={cx("field-row")}>
          <label htmlFor="apiKey" className={styles.label}>
            API Key:
          </label>
          <input
            id="apiKey"
            type="password"
            defaultValue={settings.apiKey || ""}
            onChange={(e) =>
              setSettings({ ...settings, apiKey: e.target.value })
            }
            className={styles.input}
          />
        </div>
        <div className={cx("field-row")}>
          <p className={styles.note}>
            You can use either an{" "}
            <a
              href="https://openrouter.ai/"
              target="_blank"
              rel="noopener noreferrer"
            >
              OpenRouter
            </a>{" "}
            or{" "}
            <a
              href="https://www.anthropic.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Anthropic
            </a>{" "}
            API key. Sonnet 3.5 is the default model. Using an API key bypasses
            the rate limit.
          </p>
        </div>
      </fieldset>

      {flags.tokens && <ModelSection />}

      <DirectorySection />

      <button onClick={onSave} className={styles.submit}>
        Save
      </button>
    </div>
  );
}

function DirectorySection() {
  const [rootDirectory, setRootDirectory] = useAtom(rootDirectoryHandleAtom);
  const isRootDirectorySet = useAtomValue(isRootDirectorySetAtom);

  const handleChooseDirectory = async () => {
    try {
      const directoryHandle = await window.showDirectoryPicker();
      setRootDirectory(directoryHandle);
    } catch (error) {
      console.error("Error selecting directory:", error);
    }
  };

  const handleClearDirectory = () => {
    setRootDirectory(null);
  };

  if (!supportsDirectoryPicker()) {
    return null;
  }

  return (
    <fieldset>
      <legend>Default Directory</legend>
      <div className={cx("field-row")}>
        <button onClick={handleChooseDirectory} className={styles.button}>
          Choose Directory
        </button>
        <button onClick={handleClearDirectory} className={styles.button}>
          Clear Directory
        </button>
      </div>
      <div className={cx("field-row")}>
        <p className={styles.note}>
          {isRootDirectorySet ? (
            <span>
              Current directory: <b>{rootDirectory.name}</b>
            </span>
          ) : (
            "No custom directory set. Storing in browser storage."
          )}
        </p>
      </div>
      <div className={cx("field-row")}>
        <p className={styles.note}>
          This lets you choose a real directory on you computer where all of the
          files inside of Windows 9X will be saved.
        </p>
      </div>
    </fieldset>
  );
}
