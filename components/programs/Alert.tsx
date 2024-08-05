import React, { ReactNode } from "react";
import styles from "./Alert.module.css";
import { useSetAtom, useAtomValue } from "jotai";
import { windowsListAtom } from "@/state/windowsList";
import { windowAtomFamily } from "@/state/window";
import Image from "next/image";
import xIcon from "@/components/assets/x.ico";

export function Alert({ id }: { id: string }) {
  const closeWindow = useSetAtom(windowsListAtom);
  const windowState = useAtomValue(windowAtomFamily(id));

  const handleClose = () => {
    closeWindow({ type: "REMOVE", payload: id });
  };

  if (windowState.program.type !== "alert") {
    console.error("Alert component received non-alert program type");
    return null;
  }

  const { message, icon } = windowState.program;

  return (
    <div className={styles.alertContainer}>
      <div className={styles.alertContent}>
        {icon === "x" && (
          <div className={styles.alertIcon}>
            <Image src={xIcon} alt="Alert Icon" width={32} height={32} />
          </div>
        )}
        <div className={styles.alertMessage}>{message}</div>
      </div>
      <div className={styles.alertActions}>
        <button onClick={handleClose}>OK</button>
      </div>
    </div>
  );
}
