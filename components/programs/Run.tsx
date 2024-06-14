"use client";
import { useAtomValue, useSetAtom } from "jotai";
import { windowsListAtom } from "@/state/windowsList";
import { createWindow } from "../../utils/createWindow";
import { BUILTIN_REGISTRY_KEYS, registryAtom } from "@/state/registry";

export function Run({ id }: { id: string }) {
  const windowsDispatch = useSetAtom(windowsListAtom);
  const registry = useAtomValue(registryAtom);
  return (
    <form
      style={{ display: "flex", flexDirection: "column", gap: 8 }}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const programDescription = formData.get("program-description");
        if (typeof programDescription === "string") {
          const keys = new Set(
            Object.keys(registry).filter((key) => key.startsWith("public_"))
          );

          for (const key of BUILTIN_REGISTRY_KEYS) {
            keys.add(key);
          }

          const keyString = JSON.stringify(Array.from(keys).sort());

          createWindow({
            title: programDescription,
            program: {
              type: "iframe",
              src: `/api/program?description=${programDescription}&keys=${encodeURIComponent(
                keyString
              )}`,
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
