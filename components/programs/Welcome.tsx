"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./Welcome.module.css";
import sawyersoft from "@/components/landing/assets/sawyersoft.png";
import check from "@/components/assets/check.png";

type TableOfContentsEntry = {
  title: string;
  key: string;
};

type TableOfContentsProps = {
  entries: TableOfContentsEntry[];
  selectedEntry: string;
  onSelect: (key: string) => void;
};

const TableOfContents: React.FC<TableOfContentsProps> = ({
  entries,
  selectedEntry,
  onSelect,
}) => {
  return (
    <div className={styles.sidebar}>
      <h4 className={styles.sidebarTitle}>Contents</h4>
      <ul className={styles.sidebarList}>
        {entries.map((entry) => {
          return (
            <li
              key={entry.key}
              onClick={() => onSelect(entry.key)}
              className={entry.key === selectedEntry ? styles.selected : ""}
            >
              <span>{entry.title}</span>
              {entry.key === selectedEntry && (
                <Image src={check} alt="Selected" width={16} height={16} />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const contentByKey = {
  welcome: () => {
    return (
      <>
        <h3>Welcome</h3>
        <p>
          Welcome to the exciting new world of Windows 9X, where your computer
          desktop meets Artificial Intelligence.
        </p>
        <p>
          Sit back and relax as you take a brief tour of the options available.
        </p>
        <p>
          To get started, press <strong>Start &gt; Run</strong> and type the
          description of the app you want to run. Windows 9X will create it for
          you. On any generated application you can also press the{" "}
          <strong>?</strong> button to chat with the developer and make changes
          to the program.
        </p>
        <div className={styles.buttonGroup}>
          <a
            href="https://github.com/sawyerhood/windows9x"
            target="_blank"
            rel="noopener noreferrer"
          >
            <button>GitHub</button>
          </a>
          <a
            href="https://twitter.com/sawyerhood"
            target="_blank"
            rel="noopener noreferrer"
          >
            <button>Twitter</button>
          </a>
        </div>
      </>
    );
  },
  filesystem: () => {
    return (
      <>
        <h3>Filesystem</h3>
        <p>
          In Windows 9X everything is a file. Including all of the programs that
          are running.
        </p>
        <p>
          You can explore the filesystem by opening up the aptly named{" "}
          <strong>Explorer</strong> program.
        </p>
        <p>
          Generated applications can also open and save files to the filesystem.
          Try prompting when generating to support file opening and saving
          operations for applications to define their own file formats. You can
          even read and write the contents of programs.
        </p>
      </>
    );
  },
  advanced: () => {
    return (
      <>
        <h3>Advanced</h3>
        <p>
          There are a few operating system apis that generated programs can use:
        </p>
        <ul>
          <li>Opening Files</li>
          <li>Saving Files</li>
          <li>Reading and Writing from the registry</li>
          <li>Chatting with an llm</li>
        </ul>
        <p>
          Try asking for these when generating an application to make the
          generated program use them. Opening and saving files is used for
          saving state of applications. The registry can be used for storing
          global configuration for a program (and across programs). And the chat
          api can make your program directly prompt an LLM.
        </p>
      </>
    );
  },
};

export const WIDTH = 700;

export function Welcome({ id: _id }: { id: string }) {
  const tableOfContentsEntries: TableOfContentsEntry[] = [
    { title: "Welcome", key: "welcome" },
    { title: "Filesystem", key: "filesystem" },
    { title: "Advanced", key: "advanced" },
  ];

  const [selectedEntry, setSelectedEntry] = useState("welcome");

  const handleEntrySelect = (key: string) => {
    setSelectedEntry(key);
  };

  const Content = contentByKey[selectedEntry as keyof typeof contentByKey];

  return (
    <div className={styles.welcomeContainer}>
      <Image
        src="/welcome.jpeg"
        alt="Welcome background"
        layout="fill"
        objectFit="cover"
        objectPosition="center"
      />
      <div className={styles.overlay} />
      <Image
        src={sawyersoft}
        alt="Sawyer Software Logo"
        className={styles.logo}
      />
      <div className={styles.contentWrapper}>
        <TableOfContents
          entries={tableOfContentsEntries}
          selectedEntry={selectedEntry}
          onSelect={handleEntrySelect}
        />
        <div className={styles.mainContent}>
          {Content ? <Content /> : <p>No content for this section.</p>}
        </div>
      </div>
    </div>
  );
}
