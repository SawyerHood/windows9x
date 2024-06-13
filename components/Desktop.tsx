import { useAtomValue, useSetAtom } from "jotai";
import styles from "./Desktop.module.css";
import { ProgramEntry, programsAtom } from "@/state/programs";
import window from "./assets/window.png";
import Image from "next/image";
import { createWindow } from "@/utils/createWindow";
import { useCreateContextMenu } from "@/state/contextMenu";

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
  const createContextMenu = useCreateContextMenu();
  const dispatch = useSetAtom(programsAtom);
  const runProgram = () => {
    createWindow({
      title: program.name,
      program: {
        type: "iframe",
        srcDoc: program.code,
      },
      icon: program.icon ?? undefined,
    });
  };
  return (
    <button
      className={styles.programIcon}
      onContextMenu={createContextMenu([
        { label: "Run", onClick: runProgram },
        {
          label: "Delete",
          onClick: () => {
            dispatch({
              type: "REMOVE_PROGRAM",
              payload: program.name,
            });
          },
        },
      ])}
      onDoubleClick={runProgram}
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
