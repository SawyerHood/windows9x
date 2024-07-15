"use client";

import { assertNever } from "@/lib/assertNever";
import { WindowState } from "@/state/window";
import { Iframe } from "./programs/Iframe";
import { Welcome } from "./programs/Welcome";
import { Run } from "./programs/Run";
import { Help } from "./programs/Help";
import { Explorer } from "./programs/Explorer";
import { Settings } from "./programs/Settings";
import { History } from "./programs/History";

export function WindowBody({ state }: { state: WindowState }) {
  switch (state.program.type) {
    case "welcome":
      return <Welcome id={state.id} />;
    case "run":
      return <Run id={state.id} />;
    case "iframe":
      return <Iframe id={state.id} />;
    case "help":
      return <Help id={state.id} />;
    case "explorer":
      return <Explorer id={state.id} />;
    case "settings":
      return <Settings id={state.id} />;
    case "history":
      return <History id={state.program.programID} />;
    default:
      assertNever(state.program);
  }
}
