"use client";

import React from "react";

type Actions = {
  logout: () => void;
  login: () => void;
};

const Context = React.createContext<Actions>({
  logout: () => {},
  login: () => {},
});

export const useActions = () => React.useContext(Context);

export const ActionsProvider = ({
  children,
  actions,
}: {
  children: React.ReactNode;
  actions: Actions;
}) => {
  return <Context.Provider value={actions}>{children}</Context.Provider>;
};
