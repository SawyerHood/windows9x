"use client";
import { useSetAtom } from "jotai";
import { windowsListAtom } from "@/state/windowsList";
import { createWindow } from "../../lib/createWindow";
import { ProgramEntry, programsAtom } from "@/state/programs";
import { useState } from "react";
import { getSettings } from "@/lib/getSettings";

export function Run({ id }: { id: string }) {
  const windowsDispatch = useSetAtom(windowsListAtom);
  const programsDispatch = useSetAtom(programsAtom);
  const [isLoading, setIsLoading] = useState(false);
  return (
    <form
      style={{ display: "flex", flexDirection: "column", gap: 8 }}
      onSubmit={async (e) => {
        e.preventDefault();
        if (isLoading) return;
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        const programDescription = formData.get("program-description");
        if (typeof programDescription === "string") {
          let name = programDescription;

          if (name.length > 20) {
            const nameResp = await fetch("/api/name", {
              method: "POST",
              body: JSON.stringify({
                desc: programDescription,
                settings: getSettings(),
              }),
            });

            name = (await nameResp.json()).name;
          }

          const program: ProgramEntry = {
            id: name,
            prompt: programDescription,
            name,
          };

          programsDispatch({ type: "ADD_PROGRAM", payload: program });

          createWindow({
            title: name,
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
        <textarea
          placeholder="Describe the program you want to run"
          id="program-description"
          rows={2}
          style={{
            width: "100%",
            resize: "vertical",
            maxHeight: "200px",
          }}
          name="program-description"
          spellCheck={false}
          autoComplete="off"
          autoFocus
        />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="submit" disabled={isLoading}>
          Open
        </button>
        <button
          onClick={() => windowsDispatch({ type: "REMOVE", payload: id })}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
