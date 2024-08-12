import { getDefaultStore, useAtom, useSetAtom } from "jotai";
import { MenuBar } from "./MenuBar";
import { getIframe, reloadIframe, windowAtomFamily } from "@/state/window";
import { windowsListAtom } from "@/state/windowsList";
import { createWindow } from "@/lib/createWindow";
import { getParentPath, lastVisitedPathAtom } from "@/state/lastVisitedPath";
import { getFsManager } from "@/state/fsManager";

export function WindowMenuBar({ id }: { id: string }) {
  const [state] = useAtom(windowAtomFamily(id));
  const windowsDispatch = useSetAtom(windowsListAtom);

  if (state.program.type !== "iframe") return null;

  const { programID } = state.program;

  return (
    <MenuBar
      options={[
        {
          label: "File",
          items: [
            state.program.type === "iframe"
              ? {
                  label: "Reload",
                  onClick: () => reloadIframe(id),
                }
              : null,
            state.program.canSave
              ? {
                  label: "Save",
                  onClick: () => {
                    const store = getDefaultStore();
                    const iframe = getIframe(id)!;
                    const handleSaveComplete = async (event: MessageEvent) => {
                      if (event.data.operation === "saveComplete") {
                        window.removeEventListener(
                          "message",
                          handleSaveComplete
                        );

                        const content = event.data.content;
                        const lastVisitedPath = store.get(lastVisitedPathAtom);
                        const fs = await getFsManager();
                        createWindow({
                          title: "Save",
                          program: {
                            type: "explorer",
                            currentPath:
                              lastVisitedPath &&
                              (await fs.getItem(lastVisitedPath, "shallow"))
                                ? lastVisitedPath
                                : undefined,
                            actionText: "Save",
                            action: async (path) => {
                              const fs = await getFsManager();
                              await fs.writeFile(path, content);
                              store.set(
                                lastVisitedPathAtom,
                                getParentPath(path)
                              );
                            },
                          },
                        });
                      }
                    };

                    window.addEventListener("message", handleSaveComplete);

                    iframe.contentWindow?.postMessage({
                      operation: "save",
                    });
                  },
                }
              : null,
            state.program.canOpen
              ? {
                  label: "Open",
                  onClick: async () => {
                    const store = getDefaultStore();
                    const lastVisitedPath = store.get(lastVisitedPathAtom);
                    const fs = await getFsManager();
                    createWindow({
                      title: "Open",
                      program: {
                        type: "explorer",
                        actionText: "Open",
                        currentPath:
                          lastVisitedPath &&
                          (await fs.getItem(lastVisitedPath, "shallow"))
                            ? lastVisitedPath
                            : undefined,
                        action: async (path) => {
                          const fs = await getFsManager();
                          const file = await fs.getFile(path, "deep");
                          const iframe = getIframe(id)!;
                          store.set(lastVisitedPathAtom, getParentPath(path));
                          iframe.contentWindow?.postMessage({
                            operation: "open",
                            content: file?.content,
                          });
                        },
                      },
                    });
                  },
                }
              : null,
            {
              label: "History",
              onClick: () => {
                createWindow({
                  title: "Program History",
                  program: {
                    type: "history",
                    programID,
                  },
                  pos: {
                    x: 0,
                    y: 0,
                  },
                  size: {
                    width: 300,
                    height: 300,
                  },
                });
              },
            },
            {
              label: "Close",
              onClick: () => {
                windowsDispatch({ type: "REMOVE", payload: id });
              },
            },
          ],
        },
      ]}
    />
  );
}
