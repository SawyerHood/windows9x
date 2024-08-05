import { createWindow } from "@/lib/createWindow";
import { getDefaultStore } from "jotai";
import { AlertAction, WindowState } from "@/state/window";
import { allWindowsAtom } from "@/state/allWindows";
import { ReactNode } from "react";

type AlertOptions = {
  message: ReactNode;
  alertId?: string;
  icon?: "x";
  actions?: AlertAction[];
};

export function alert({ message, alertId, icon, actions }: AlertOptions) {
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
    size: {
      width: 400,
      height: "auto",
    },
    program: {
      type: "alert",
      message,
      alertId,
      icon,
      actions,
    },
  });
}
