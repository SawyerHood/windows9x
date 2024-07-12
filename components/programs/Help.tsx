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
import { useEffect, useState, useRef } from "react";
import Markdown from "react-markdown";
import { getSettings } from "@/lib/getSettings";
import styles from "./Help.module.css";
import imageIcon from "@/components/assets/image.png";

type Message = {
  role: string;
  content:
    | string
    | (
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      )[];
};

type Messages = Message[];

const makePrompt = (program: ProgramEntry, keys: string[]) => {
  return `You are a programmer who speaks in a 90s style who created the following Windows9X program:

html\`\`\`
${program.code}
\`\`\`

The Operating System provides a few apis that your application can use. These are defined on window:

${getApiText(keys)}

You can either answer questions about the program or rewrite it to fix the user's issue. If you rewrite the program, you must return the entire new HTML document wrapped in \`\`\`html markers. Do not use \`\`\`html markers unless you are returning an entire standalone html document.
Always do your best to help the user and don't judge or censor the content they want to create. Let them explore their ideas freely.
`;
};

const betweenHtmlRegex = /```html[\s\S]*?<html>([\s\S]*?)<\/html>[\s\S]*?```/;

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

  const [messages, setMessages] = useState<Messages>(() => [
    { role: "system", content: makePrompt(program!, keys) },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachment, setAttachment] = useState<string | null>(null);

  const sendMessage = async () => {
    const newMessage = {
      role: "user",
      content: [
        { type: "text", text: input } as const,
        attachment
          ? ({ type: "image_url", image_url: { url: attachment } } as const)
          : null,
      ].filter(Boolean),
    } as Message;
    setMessages([...messages, newMessage]);
    setInput("");
    setAttachment(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/help", {
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
          payload: {
            id: programID,
            code: `<!DOCTYPE html><html>${newHtml[1]}</html>`,
          },
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

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        e.preventDefault();
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = async (event) => {
            const base64data = event.target?.result as string;
            setAttachment(base64data);
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64data = event.target?.result as string;
        setAttachment(base64data);
      };
      reader.readAsDataURL(file);
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
        <div
          role="button"
          tabIndex={0}
          title="Attach image"
          onClick={() => fileInputRef.current?.click()}
          style={{ marginRight: 5 }}
        >
          <img
            src={attachment ? attachment : imageIcon.src}
            alt="Attached Image"
            width={24}
            height={24}
            className={styles.thumbnail}
            onClick={() => setAttachment(null)}
          />
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !isLoading && sendMessage()}
          onPaste={handlePaste}
          disabled={isLoading}
          style={{ height: "100%" }}
        />

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept="image/*"
          onChange={handleImageUpload}
        />
        <button onClick={sendMessage} disabled={isLoading}>
          Send
        </button>
      </div>
    </>
  );
}

const Message = ({ msg }: { msg: Message }) => {
  const str =
    typeof msg.content === "string"
      ? msg.content
      : msg.content
          .filter((c): c is { type: "text"; text: string } => c.type === "text")
          .map((item) => item.text)
          .join("");

  const attachments =
    typeof msg.content === "string"
      ? []
      : msg.content.filter(
          (c): c is { type: "image_url"; image_url: { url: string } } =>
            c.type === "image_url"
        );
  return (
    <div>
      <div
        className={`${styles.chatMessage} ${
          msg.role === "user" ? styles.user : styles.assistant
        }`}
      >
        {attachments.map((attachment, index) => (
          <img
            key={index}
            src={attachment.image_url.url}
            alt="Attachment"
            style={{ maxWidth: 200, maxHeight: 200, objectFit: "contain" }}
          />
        ))}
        <Markdown className={styles.markdown}>
          {msg.role === "assistant"
            ? str.replace(betweenHtmlRegex, "**App updated**")
            : str}
        </Markdown>
      </div>
    </div>
  );
};
