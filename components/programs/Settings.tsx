"use client";

import { useAtom, useSetAtom } from "jotai";
import { settingsAtom } from "@/state/settings";
import { windowsListAtom } from "@/state/windowsList";
import { rootDirectoryHandleAtom } from "@/lib/realFs/rootDirectory";
import styles from "./Settings.module.css";
import cx from "classnames";
import { ModelSection } from "../ModelSection";
import { useFlags } from "@/flags/context";

export function Settings({ id }: { id: string }) {
  const [settings, setSettings] = useAtom(settingsAtom);
  const windowsDispatch = useSetAtom(windowsListAtom);
  const [rootDirectory, setRootDirectory] = useAtom(rootDirectoryHandleAtom);
  const flags = useFlags();

  const onSave = () => {
    windowsDispatch({ type: "REMOVE", payload: id });
  };

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
            {rootDirectory
              ? `Current directory: ${rootDirectory.name}`
              : "No custom directory set. Using default."}
          </p>
        </div>
      </fieldset>
      <button onClick={onSave} className={styles.submit}>
        Save
      </button>
    </div>
  );
}
