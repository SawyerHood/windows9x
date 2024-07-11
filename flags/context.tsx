"use client";

import React from "react";
import { DEFAULT_FLAGS, Flags } from "./flags";

const FlagsContext = React.createContext<Flags>(DEFAULT_FLAGS);

export const useFlags = () => React.useContext(FlagsContext);

export function FlagsProvider({
  children,
  flags,
}: {
  children: React.ReactNode;
  flags: Flags;
}) {
  return (
    <FlagsContext.Provider value={flags}>{children}</FlagsContext.Provider>
  );
}
