import { atom, useSetAtom } from "jotai";

export const contextMenuAtom = atom<{
  x: number;
  y: number;
  items: { label: string; onClick: () => void }[];
} | null>(null);

export function useCreateContextMenu() {
  const setContextMenu = useSetAtom(contextMenuAtom);

  return (items: { label: string; onClick: () => void }[]) =>
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, items });
    };
}
