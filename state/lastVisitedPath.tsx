import { atom } from "jotai";

export const lastVisitedPathAtom = atom<string | null>(null);

export function getParentPath(path: string): string {
  return path.split("/").slice(0, -1).join("/");
}
