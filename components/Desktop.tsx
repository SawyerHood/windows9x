import { useAtomValue, useSetAtom } from "jotai";
import styles from "./Desktop.module.css";
import { ProgramEntry, programsAtom } from "@/state/programs";
import window from "./assets/window.png";
import Image from "next/image";
import { createWindow } from "@/lib/createWindow";
import { useCreateContextMenu } from "@/state/contextMenu";
import { themeAtom } from "@/state/theme"; // Import theme state

export const Desktop = () => {
  const { programs } = useAtomValue(programsAtom);
  const theme = useAtomValue(themeAtom); // Use theme state to adjust styles conditionally
  return (
    <div className={`${styles.desktop} ${theme === 'XP' ? styles.xpTheme : ''}`}> // Apply XP theme styles conditionally
      {programs.map((program) => (
        <ProgramIcon key={program.name} program={program} />
      ))}
    </div>
  );
};

function ProgramIcon({ program }: { program: ProgramEntry }) {
  const createContextMenu = useCreateContextMenu();
  const dispatch = useSetAtom(programsAtom);
  const theme = useAtomValue(themeAtom); // Use theme state to adjust styles conditionally
  const runProgram = () => {
    createWindow({
      title: program.name,
      program: {
        type: "iframe",
        programID: program.id,
      },
      icon: program.icon ?? undefined,
    });
  };
  return (
    <button
      className={`${styles.programIcon} ${theme === 'XP' ? styles.xpTheme : ''}`} // Apply XP theme styles conditionally
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
      <div className={`${styles.programName} ${theme === 'XP' ? styles.xpTheme : ''}`}>{program.name}</div> // Apply XP theme styles conditionally
    </button>
  );
}
