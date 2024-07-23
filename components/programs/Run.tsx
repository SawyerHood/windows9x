"use client";
import { useAtomValue, useSetAtom } from "jotai";
import { windowsListAtom } from "@/state/windowsList";
import { createWindow } from "../../lib/createWindow";
import { ProgramEntry, programsAtom } from "@/state/programs";
import { useState } from "react";
import { getSettings } from "@/lib/getSettings";
import { settingsAtom } from "@/state/settings";
import { useFlags } from "@/flags/context";
import { trpc } from "@/lib/api/client";
import { SettingsLink } from "../SettingsLink";
import { spawn } from "@/lib/spawn";

export function Run({ id }: { id: string }) {
  const windowsDispatch = useSetAtom(windowsListAtom);
  const programsDispatch = useSetAtom(programsAtom);
  const settings = useAtomValue(settingsAtom);
  const [isLoading, setIsLoading] = useState(false);
  const flags = useFlags();
  const { data } = trpc.getTokens.useQuery();
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
          await spawn({
            description: programDescription,
            settings,
            programsDispatch,
          });
          windowsDispatch({ type: "REMOVE", payload: id });
        }
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <p>
          Type the description of the program you want to run and Windows will
          create it for you.
        </p>
        {flags.tokens && (
          <>
            <p>
              You are currently using the{" "}
              <strong>{settings.model === "best" ? "Quality" : "Fast"}</strong>{" "}
              model. You currently have{" "}
              <strong style={{ color: "green" }}>{data?.tokens}</strong> Quality
              Tokens left. You can enter your own API key in the{" "}
              <SettingsLink />.
            </p>
          </>
        )}
      </div>
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
