import { useAtom, useSetAtom } from "jotai";
import { MenuBar } from "./MenuBar";
import { getIframe, reloadIframe, windowAtomFamily } from "@/state/window";
import { windowsListAtom } from "@/state/windowsList";
import { createWindow } from "@/lib/createWindow";
import { fileSystemAtom } from "@/state/filesystem";

export function WindowMenuBar({ id }: { id: string }) {
  const [state, dispatch] = useAtom(windowAtomFamily(id));
  const windowsDispatch = useSetAtom(windowsListAtom);
  const [fileSystem, setFileSystem] = useAtom(fileSystemAtom);

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
                    const iframe = getIframe(id)!;
                    const handleSaveComplete = (event: MessageEvent) => {
                      if (event.data.operation === "saveComplete") {
                        window.removeEventListener(
                          "message",
                          handleSaveComplete
                        );

                        const content = event.data.content;
                        createWindow({
                          title: "Save",
                          program: {
                            type: "explorer",
                            actionText: "Save",
                            action: (path) => {
                              setFileSystem((fs) =>
                                fs.createOrUpdateFile(path, content)
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
                    createWindow({
                      title: "Open",
                      program: {
                        type: "explorer",
                        actionText: "Open",
                        action: (path) => {
                          const file = fileSystem.readFile(path);
                          const iframe = getIframe(id)!;
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
