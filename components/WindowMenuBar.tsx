import { getDefaultStore, useAtom, useSetAtom } from "jotai";
import { MenuBar } from "./MenuBar";
import { getIframe, reloadIframe, windowAtomFamily } from "@/state/window";
import { windowsListAtom } from "@/state/windowsList";
import { createWindow } from "@/lib/createWindow";
import { fileSystemAtom } from "@/state/filesystem";
import { getParentPath, lastVisitedPathAtom } from "@/state/lastVisitedPath";

export function WindowMenuBar({ id }: { id: string }) {
  const [state] = useAtom(windowAtomFamily(id));
  const windowsDispatch = useSetAtom(windowsListAtom);
  const [_, setFileSystem] = useAtom(fileSystemAtom);

  if (state.program.type !== "iframe") return null;

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
                    const handleSaveComplete = (event: MessageEvent) => {
                      if (event.data.operation === "saveComplete") {
                        window.removeEventListener(
                          "message",
                          handleSaveComplete
                        );

                        const content = event.data.content;
                        const lastVisitedPath = store.get(lastVisitedPathAtom);
                        const fs = store.get(fileSystemAtom);
                        createWindow({
                          title: "Save",
                          program: {
                            type: "explorer",
                            currentPath:
                              lastVisitedPath && fs.exists(lastVisitedPath)
                                ? lastVisitedPath
                                : undefined,
                            actionText: "Save",
                            action: (path) => {
                              setFileSystem((fs) =>
                                fs.createOrUpdateFile(path, content)
                              );
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
                  onClick: () => {
                    const store = getDefaultStore();
                    const lastVisitedPath = store.get(lastVisitedPathAtom);
                    const fs = store.get(fileSystemAtom);
                    createWindow({
                      title: "Open",
                      program: {
                        type: "explorer",
                        actionText: "Open",
                        currentPath:
                          lastVisitedPath && fs.exists(lastVisitedPath)
                            ? lastVisitedPath
                            : undefined,
                        action: (path) => {
                          const fs = store.get(fileSystemAtom);
                          const file = fs.readFile(path);
                          const iframe = getIframe(id)!;
                          store.set(lastVisitedPathAtom, getParentPath(path));
                          iframe.contentWindow?.postMessage({
                            operation: "open",
                            content: file,
                          });
                        },
                      },
                    });
                  },
                }
              : null,
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
