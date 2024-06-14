"use client";

import { assertNever } from "@/utils/assertNever";
import { WindowState } from "@/state/window";
import { Paint } from "./programs/Paint";
import { Iframe } from "./programs/Iframe";
import { Welcome } from "./programs/Welcome";
import { Run } from "./programs/Run";
import { Help } from "./programs/Help";

export function WindowBody({ state }: { state: WindowState }) {
  switch (state.program.type) {
    case "welcome":
      return <Welcome id={state.id} />;
    case "run":
      return <Run id={state.id} />;
    case "iframe":
      return <Iframe id={state.id} />;
    case "paint":
      return <Paint id={state.id} />;
    case "help":
      return <Help id={state.id} />;
    default:
      assertNever(state.program);
  }
}
