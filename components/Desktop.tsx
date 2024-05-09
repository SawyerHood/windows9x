import { useAtomValue } from "jotai";
import styles from "./Desktop.module.css";
import { ProgramEntry, programsAtom } from "@/state/programs";
import window from "./assets/window.png";
import Image from "next/image";
import { createWindow } from "@/utils/createWindow";

export const Desktop = () => {
  const { programs } = useAtomValue(programsAtom);
  return (
    <div className={styles.desktop}>
      {programs.map((program) => (
        <ProgramIcon key={program.name} program={program} />
      ))}
    </div>
  );
};

function ProgramIcon({ program }: { program: ProgramEntry }) {
  return (
    <button
      className={styles.programIcon}
      onDoubleClick={() => {
        createWindow({
          title: program.name,
          program: {
            type: "iframe",
            srcDoc: program.code,
          },
          icon: program.icon ?? undefined,
        });
      }}
    >
      <Image
        src={program.icon ?? window}
        alt={program.name}
        width={24}
        height={24}
      />
      <div className={styles.programName}>{program.name}</div>
    </button>
  );
}
