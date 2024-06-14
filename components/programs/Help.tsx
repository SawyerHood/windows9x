"use client";

import {
  ProgramEntry,
  programAtomFamily,
  programsAtom,
} from "@/state/programs";
import { WindowState, windowAtomFamily } from "@/state/window";
import { windowsListAtom } from "@/state/windowsList";
import { assert } from "@/utils/assert";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";

const makePrompt = (program: ProgramEntry) => {
  return `You are a helpful assistant designed for the following Windows96 program:

html\`\`\`
${program.code}
\`\`\`

You can either answer questions about the program or rewrite it to fix the user's issue. If you rewrite the program, you must return the entire new HTML document wrapped in html\`\`\` markers.
`;
};

export function Help({ id }: { id: string }) {
  const helpWindow = useAtomValue(windowAtomFamily(id));
  const windowsListDispatch = useSetAtom(windowsListAtom);
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

  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    () => [{ role: "system", content: makePrompt(program!) }]
  );
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    const newMessage = { role: "user", content: input };
    setMessages([...messages, newMessage]);
    setInput("");

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: [...messages, newMessage] }),
    });

    let data = await response.json();

    const newHtml = data.match(/html```([\s\S]*?)```/);

    if (newHtml) {
      programsDispatch({
        type: "UPDATE_PROGRAM",
        payload: { id: programID, code: newHtml[1] },
      });
      data = data.replace(/html```([\s\S]*?)```/, "**App updated**");
    }

    setMessages([
      ...messages,
      newMessage,
      { role: "assistant", content: data },
    ]);
  };

  return (
    <>
      <div
        className="chat-box"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px",
          border: "1px solid #000",
        }}
      >
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
      </div>
      <div
        className="chat-input"
        style={{ display: "flex", marginTop: "10px" }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          style={{ flex: 1, padding: "5px", border: "1px solid #000" }}
        />
        <button
          onClick={sendMessage}
          style={{ marginLeft: "5px", padding: "5px 10px" }}
        >
          Send
        </button>
      </div>
    </>
  );
}

const Message = ({ msg }: { msg: { role: string; content: string } }) => (
  <div
    style={{
      margin: "5px 0",
    }}
  >
    <div
      className={`chat-message ${msg.role}`}
      style={{
        display: "inline-block",
        padding: "5px 10px",
        borderRadius: "5px",
        background: msg.role === "user" ? "#acf" : "#eaeaea",
      }}
    >
      <Markdown>{msg.content}</Markdown>
    </div>
  </div>
);
