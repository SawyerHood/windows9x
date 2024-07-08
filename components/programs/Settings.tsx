"use client";

import { useAtom, useSetAtom } from "jotai";
import { settingsAtom } from "@/state/settings";
import { windowsListAtom } from "@/state/windowsList";
import styles from "./Settings.module.css";
import cx from "classnames";
import { trpc } from "@/lib/api/client";

export function Settings({ id }: { id: string }) {
  const [settings, setSettings] = useAtom(settingsAtom);
  const windowsDispatch = useSetAtom(windowsListAtom);
  const { data } = trpc.getTokens.useQuery();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    windowsDispatch({ type: "REMOVE", payload: id });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.body}>
      <section>
        <h4>Custom API Key</h4>
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
            API key. Sonnet 3.5 is the default model.
          </p>
        </div>
      </section>
      <hr></hr>
      <section>
        <h4>Remaining Tokens</h4>
        <p>
          Remaining Tokens:{" "}
          <span className={styles.highlight}>{data?.tokens}</span>
        </p>
        <p className={styles.note}>
          Note: Tokens are used for Sonnet 3.5 generations. You get 10 free
          tokens every week for generations.
        </p>
      </section>

      <button type="submit" className={styles.submit}>
        Save
      </button>
    </form>
  );
}
