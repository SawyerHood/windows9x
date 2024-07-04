"use client";

import {
  ProgramEntry,
  programAtomFamily,
  programsAtom,
} from "@/state/programs";
import { registryAtom } from "@/state/registry";
import { windowAtomFamily } from "@/state/window";
import { windowsListAtom } from "@/state/windowsList";
import { getApiText } from "@/lib/apiText";
import { assert } from "@/lib/assert";
import { getRegistryKeys } from "@/lib/getRegistryKeys";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import { getSettings } from "@/lib/getSettings";
import styles from "./Help.module.css";

const makePrompt = (program: ProgramEntry, keys: string[]) => {
  return `You are a helpful assistant designed for the following Windows9X program:

html\`\`\`
${program.code}
\`\`\`

The Operating System provides a few apis that your application can use. These are defined on window:

${getApiText(keys)}

You can either answer questions about the program or rewrite it to fix the user's issue. If you rewrite the program, you must return the entire new HTML document wrapped in \`\`\`html markers.
`;
};

const betweenHtmlRegex = /```html([\s\S]*)```/;

export function Help({ id }: { id: string }) {
  const helpWindow = useAtomValue(windowAtomFamily(id));
  const windowsListDispatch = useSetAtom(windowsListAtom);
  const registry = useAtomValue(registryAtom);
  assert(
    helpWindow.program.type === "help" && helpWindow.program.targetWindowID,
    "Help window must have a target window ID"
  );
  const targetWindow = useAtomValue(
    windowAtomFamily(helpWindow.program.targetWindowID)
  );
  const programsDispatch = useSetAtom(programsAtom);
  assert(
    targetWindow.program.type === "iframe",
    "Target window is not an iframe"
  );

  const programID = targetWindow.program.programID;

  useEffect(() => {
    if (!targetWindow) {
      windowsListDispatch({
        type: "REMOVE",
        payload: id,
      });
    }
  }, [id, targetWindow, windowsListDispatch]);

  const program = useAtomValue(programAtomFamily(programID));

  const keys = getRegistryKeys(registry);

  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    () => [{ role: "system", content: makePrompt(program!, keys) }]
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    const newMessage = { role: "user", content: input };
    setMessages([...messages, newMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, newMessage],
          settings: getSettings(),
        }),
      });

      const data = await response.json();

      const newHtml = data.match(betweenHtmlRegex);

      if (newHtml) {
        programsDispatch({
          type: "UPDATE_PROGRAM",
          payload: { id: programID, code: newHtml[1] },
        });
      }

      setMessages([
        ...messages,
        newMessage,
        { role: "assistant", content: data },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={styles.chatBox}>
        <Message
          msg={{
            role: "system",
            content:
              "Hello! I'm the software engineer who designed this app. \n\n **How can I help you today?**",
          }}
        />
        {messages
          .filter((msg) => msg.role !== "system")
          .map((msg, index) => (
            <Message key={index} msg={msg} />
          ))}
        {isLoading && (
          <div className={styles.loadingIndicator}>
            <span>L</span>
            <span>O</span>
            <span>A</span>
            <span>D</span>
            <span>I</span>
            <span>N</span>
            <span>G</span>
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </div>
        )}
      </div>
      <div className={styles.chatInput}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !isLoading && sendMessage()}
          disabled={isLoading}
        />
        <button onClick={sendMessage} disabled={isLoading}>
          Send
        </button>
      </div>
    </>
  );
}

const Message = ({ msg }: { msg: { role: string; content: string } }) => (
  <div>
    <div
      className={`${styles.chatMessage} ${
        msg.role === "user" ? styles.user : styles.assistant
      }`}
    >
      <Markdown className={styles.markdown}>
        {msg.role === "assistant"
          ? msg.content.replace(betweenHtmlRegex, "**App updated**")
          : msg.content}
      </Markdown>
    </div>
  </div>
);
