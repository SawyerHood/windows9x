import { createWindow } from "@/lib/createWindow";
import { getDefaultStore } from "jotai";
import { WindowState } from "@/state/window";
import { allWindowsAtom } from "@/state/allWindows";
import { ReactNode } from "react";

type AlertOptions = {
  message: ReactNode;
  alertId?: string;
  icon?: "x";
};

export function alert({ message, alertId, icon }: AlertOptions) {
  const store = getDefaultStore();
  const existingWindows = store.get(allWindowsAtom);

  // Check if an alert with the same alertId already exists
  if (
    alertId &&
    existingWindows.some(
      (w: WindowState) =>
        w.program.type === "alert" && w.program.alertId === alertId
    )
  ) {
    return;
  }

  createWindow({
    title: "Alert",
    program: {
      type: "alert",
      message,
      alertId,
      icon,
    },
  });
}

declare global {
  interface Window {
    myAlert: typeof alert;
  }
}

window.myAlert = alert;
