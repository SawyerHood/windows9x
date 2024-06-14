"use client";
import { useAtomValue, useSetAtom } from "jotai";
import { windowsListAtom } from "@/state/windowsList";
import { createWindow } from "../../utils/createWindow";
import { BUILTIN_REGISTRY_KEYS, registryAtom } from "@/state/registry";
import { ProgramEntry, programsAtom } from "@/state/programs";

export function Run({ id }: { id: string }) {
  const windowsDispatch = useSetAtom(windowsListAtom);
  const programsDispatch = useSetAtom(programsAtom);
  const registry = useAtomValue(registryAtom);
  return (
    <form
      style={{ display: "flex", flexDirection: "column", gap: 8 }}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const programDescription = formData.get("program-description");
        if (typeof programDescription === "string") {
          const program: ProgramEntry = {
            id: crypto.randomUUID(),
            prompt: programDescription,
            name: programDescription,
          };

          programsDispatch({ type: "ADD_PROGRAM", payload: program });

          createWindow({
            title: programDescription,
            program: {
              type: "iframe",
              programID: program.id,
            },
            loading: true,
            size: {
              width: 400,
              height: 400,
            },
          });
          windowsDispatch({ type: "REMOVE", payload: id });
        }
      }}
    >
      <p>
        Type the description of the program you want to run and Windows will
        create it for you.
      </p>
      <div className="field-row">
        <label htmlFor="program-description">Open: </label>
        <input
          id="program-description"
          name="program-description"
          type="text"
          style={{ width: "100%" }}
          spellCheck={false}
          autoComplete="off"
          autoFocus
        />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="submit">Open</button>
        <button
          onClick={() => windowsDispatch({ type: "REMOVE", payload: id })}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
