"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./Welcome.module.css";
import sawyersoft from "@/components/landing/assets/sawyersoft.png";
import check from "@/components/assets/check.png";
import { SettingsLink } from "../SettingsLink";
import history from "./updateAssets/history.png";
import mount from "./updateAssets/mount.png";

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
  updates: () => {
    return (
      <>
        <h3>Updates</h3>
        <h4>August 5th, 2024</h4>
        <p>
          I&apos;m back from vacation and with some small quality of life
          improvements.
        </p>
        <ul>
          <li>
            When your program uses the <code>chat</code> api, it no longer
            counts against your quality tokens. I&apos;m working on new metering
            methods for that.
          </li>
          <li>You can now double click to run programs in Explorer.</li>
        </ul>
        <h4>July 23rd, 2024</h4>
        <p>
          Introducing mounted file systems. You can now access a directory on
          your computer inside of Windows 9X. Generate programs inside of
          Windows 9X and use them to edit files on your actual file system.
        </p>
        <Image src={mount} alt="Image of mounted filesystem" width={400} />
        <h4>July 19th, 2024</h4>
        We now have the ability to sync your Windows 9X filesystem to your
        actual file system! Open up Settings and choose a directory to set as
        your system directory. This will mount your filesystem to that directory
        and any files you make in Windows 9X will be saved to that directory.
        You can also directly edit those files from your real operating system
        and they will magically update in Windows 9X.
        <blockquote className="twitter-tweet" data-media-max-width="560">
          <p lang="en" dir="ltr">
            What if the filesystem for your fake ai generated operating system
            was actually real? Generating a program w/ claude -&gt; that is
            written to my filesystem that I can edit in my local code editor
            -&gt; that is hot reloaded in my fake os{" "}
            <a href="https://t.co/ZRQrTlQJNv">pic.twitter.com/ZRQrTlQJNv</a>
          </p>
          &mdash; Sawyer Hood (@sawyerhood){" "}
          <a href="https://twitter.com/sawyerhood/status/1813589978095788286?ref_src=twsrc%5Etfw">
            July 17, 2024
          </a>
        </blockquote>{" "}
        <script
          async
          src="https://platform.twitter.com/widgets.js"
          charSet="utf-8"
        ></script>
        <hr />
        <h4>July 15th, 2024</h4>
        <p>
          Added version history to generated programs. You can now go back to
          previous versions of a program and undo changes. To get started press{" "}
          <code>File &gt; History</code> in a program that is open. This is a
          first pass at this feature, expect it to be improved in the future!
        </p>
        <Image src={history} alt="History" />
        <p>
          Quality programs can now be twice as long. You should be able to
          generate more complex programs.
        </p>
        <p>
          We are upgrading our database tonight to support more traffic! There
          will be a few minutes of downtime around 8pm PT tonight.
        </p>
        <hr />
        <h4>July 14th, 2024</h4>
        <p>
          We are getting more traffic than expected! I&apos;ve temporarily
          scaled back the number of Quality Tokens that free users start with to
          5. You can purchase more tokens in the <SettingsLink />.
        </p>
        <p>
          Icon generation has also been disabled unless you are generating with
          the Quality model.
        </p>
        <p>
          I&apos;ve also added a quick overview video that shows off some of the
          things you can do in Windows 9X:
        </p>
        <Video />
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
  tutorial: () => {
    return (
      <>
        <Video />
        <p>
          Here is a quick video overview that shows off some of the things you
          can do in Windows 9X.
        </p>
      </>
    );
  },
};

function Video() {
  return (
    <iframe
      width="430"
      height="240"
      src="https://www.youtube.com/embed/v-ryqn2x35Q?si=Tn7C_pZtCNIAbmfk"
      title="YouTube video player"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    ></iframe>
  );
}

export const WIDTH = 700;

export function Welcome({ id: _id }: { id: string }) {
  const tableOfContentsEntries: TableOfContentsEntry[] = [
    { title: "Welcome", key: "welcome" },
    { title: "Updates", key: "updates" },
    { title: "Filesystem", key: "filesystem" },
    { title: "Advanced", key: "advanced" },
    { title: "Tutorial", key: "tutorial" },
  ];

  const [selectedEntry, setSelectedEntry] = useState(() => {
    if (typeof window !== "undefined") {
      const onboarded = localStorage.getItem("onboarded");
      return onboarded ? "updates" : "welcome";
    }
    return "welcome";
  });

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("onboarded")) {
      localStorage.setItem("onboarded", "true");
    }
  }, []);

  const handleEntrySelect = (key: string) => {
    setSelectedEntry(key);
  };

  const Content = contentByKey[selectedEntry as keyof typeof contentByKey];

  return (
    <div className={styles.welcomeContainer}>
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
