import { atom } from "jotai";
import { windowAtomFamily, WindowState } from "./window";
import { windowsListAtom } from "./windowsList";

export const allWindowsAtom = atom<WindowState[]>((get) => {
  const list = get(windowsListAtom);
  return list.map((id) => get(windowAtomFamily(id)));
});
