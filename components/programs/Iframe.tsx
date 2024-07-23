"use client";
import { getDefaultStore, useAtom, useAtomValue, useSetAtom } from "jotai";
import { getIframeID, windowAtomFamily } from "@/state/window";
import { useEffect, useRef } from "react";
import { programAtomFamily, programsAtom } from "@/state/programs";
import assert from "assert";
import { registryAtom } from "@/state/registry";
import { getURLForProgram } from "@/lib/getURLForProgram";
import { getSettings } from "@/lib/getSettings";
import { settingsAtom } from "@/state/settings";
import { spawn } from "@/lib/spawn";
import { useStore } from "jotai";

export function Iframe({ id }: { id: string }) {
  const window = useAtomValue(windowAtomFamily(id));
  assert(window.program.type === "iframe", "Window is not an iframe");
  const program = useAtomValue(programAtomFamily(window.program.programID));
  // Return null if the program is not found
  if (!program) {
    return null;
  }
  return <IframeInner id={id} />;
}

function IframeInner({ id }: { id: string }) {
  const [state, dispatch] = useAtom(windowAtomFamily(id));
  const ref = useRef<HTMLIFrameElement>(null);
  const dispatchPrograms = useSetAtom(programsAtom);
  const startedRef = useRef(false);
  const registry = useAtomValue(registryAtom);
  const { model } = useAtomValue(settingsAtom);
  const store = useStore();

  assert(state.program.type === "iframe", "Program is not an iframe");

  const program = useAtomValue(programAtomFamily(state.program.programID));

  const { icon } = state;

  const programID = state.program.programID;

  assert(program, "Program not found");

  const url = getURLForProgram(program, registry);

  useEffect(() => {
    async function fetchIcon() {
      if (startedRef.current) {
        return;
      }
      startedRef.current = true;
      const res = await fetch(`/api/icon?name=${state.title}`, {
        method: "POST",
        body: JSON.stringify({ name: state.title, settings: getSettings() }),
      });

      if (!res.ok) {
        return;
      }
      const dataUri = await res.text();
      dispatch({ type: "SET_ICON", payload: dataUri });
      dispatchPrograms({
        type: "UPDATE_PROGRAM",
        payload: {
          id: programID,
          name: state.title,
          icon: dataUri,
        },
      });
      startedRef.current = false;
    }
    if (!icon && model === "best") {
      fetchIcon();
    }
  }, [state.title, dispatch, dispatchPrograms, icon, programID, model]);

  // Adding message event listener to the iframe to handle registry operations
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Check if the message is from our iframe
      if (event.source !== ref.current?.contentWindow) {
        return;
      }

      // Assuming the message contains the operation type and key-value data
      const {
        operation,
        key,
        value,
        id,
        returnJson,
        description,
        base64Image,
      } = event.data;

      const store = getDefaultStore();
      const registry = await store.get(registryAtom);

      switch (operation) {
        case "get": {
          event.source!.postMessage({
            operation: "result",
            id,
            value: registry[key],
          });
          break;
        }
        case "set": {
          store.set(registryAtom, { ...registry, [key]: value });
          break;
        }
        case "delete": {
          store.set(registryAtom, { ...registry, [key]: undefined });
          break;
        }
        case "listKeys": {
          event.source!.postMessage({
            operation: "result",
            id,
            value: Object.keys(registry),
          });
          break;
        }
        case "chat": {
          const result = await fetch(`/api/chat`, {
            method: "POST",
            body: JSON.stringify({
              messages: value,
              returnJson,
              settings: getSettings(),
            }),
          });
          event.source!.postMessage({
            operation: "result",
            value: await result.json(),
            id,
          });
          break;
        }
        case "registerOnSave": {
          dispatch({
            type: "UPDATE_PROGRAM",
            payload: { type: "iframe", canSave: true },
          });
          break;
        }
        case "registerOnOpen": {
          dispatch({
            type: "UPDATE_PROGRAM",
            payload: { type: "iframe", canOpen: true },
          });
          break;
        }
        case "saveComplete": {
          // Handled in Window.tsx
          break;
        }
        case "spawn": {
          const settings = getSettings();

          await spawn({
            description,
            settings,
            programsDispatch: dispatchPrograms,
            base64Image,
          });

          event.source!.postMessage({
            operation: "result",
            id,
            result: "Program spawned successfully",
          });
          break;
        }

        default:
          console.error("Unsupported operation");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [dispatch, ref, store, dispatchPrograms]);

  return (
    <iframe
      ref={ref}
      id={getIframeID(id)}
      sandbox={!program?.code ? "allow-same-origin" : undefined}
      src={!program?.code ? url : undefined}
      srcDoc={program?.code || undefined}
      style={{ width: "100%", flexGrow: 1, border: "none" }}
      onLoad={() => {
        assert(state.program.type === "iframe", "Program is not an iframe");

        if (program?.code) {
          return;
        }

        dispatch({ type: "SET_LOADING", payload: false });
        if (ref.current) {
          const outerHTML =
            ref.current.contentDocument?.documentElement.outerHTML;
          assert(outerHTML, "Outer HTML of iframe content is undefined");
          assert(state.program.type === "iframe", "Program is not an iframe");
          dispatchPrograms({
            type: "UPDATE_PROGRAM",
            payload: {
              id: programID,
              code: outerHTML,
            },
          });
        }
      }}
    />
  );
}
