"use client";

import { assertNever } from "@/utils/assertNever";
import { useAtom, useSetAtom } from "jotai";
import { windowsListAtom } from "@/state/windowsList";
import { WindowState, windowAtomFamily } from "@/state/window";
import { createWindow } from "../utils/createWindow";
import { Paint } from "./Paint";
import { useEffect, useRef } from "react";
import { programsAtom } from "@/state/programs";
import assert from "assert";

export function WindowBody({ state }: { state: WindowState }) {
  switch (state.program.type) {
    case "welcome":
      return <Welcome id={state.id} />;
    case "run":
      return <Run id={state.id} />;
    case "iframe":
      return <Iframe id={state.id} />;
    case "paint":
      return <Paint id={state.id} />;
    default:
      assertNever(state.program);
  }
}
function Welcome({ id }: { id: string }) {
  return <div>Welcome to Windows 96</div>;
}
function Run({ id }: { id: string }) {
  const windowsDispatch = useSetAtom(windowsListAtom);
  return (
    <form
      style={{ display: "flex", flexDirection: "column", gap: 8 }}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const programDescription = formData.get("program-description");
        if (typeof programDescription === "string") {
          createWindow({
            title: programDescription,
            program: {
              type: "iframe",
              src: `/api/program?description=${programDescription}`,
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

function Iframe({ id }: { id: string }) {
  const [state, dispatch] = useAtom(windowAtomFamily(id));
  const ref = useRef<HTMLIFrameElement>(null);
  const dispatchPrograms = useSetAtom(programsAtom);
  const startedRef = useRef(false);

  assert(state.program.type === "iframe", "Program is not an iframe");
  const { icon } = state;

  useEffect(() => {
    async function fetchIcon() {
      if (startedRef.current) {
        return;
      }
      startedRef.current = true;
      const res = await fetch(`/api/icon?name=${state.title}`, {
        method: "POST",
        body: JSON.stringify({ name: state.title }),
      });

      if (!res.ok) {
        return;
      }
      const dataUri = await res.text();
      dispatch({ type: "SET_ICON", payload: dataUri });
      dispatchPrograms({
        type: "UPDATE_PROGRAM",
        payload: {
          name: state.title,
          icon: dataUri,
        },
      });
      startedRef.current = false;
    }
    if (!icon) {
      fetchIcon();
    }
  }, [state.title, dispatch, dispatchPrograms, icon]);

  return (
    <iframe
      ref={ref}
      src={state.program.src ?? undefined}
      srcDoc={state.program.srcDoc ?? undefined}
      style={{ width: "100%", height: "100%", border: "none" }}
      allowTransparency
      onLoad={() => {
        assert(state.program.type === "iframe", "Program is not an iframe");

        if (!state.program.src) {
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
              name: state.title,
              url: state.program.src!,
              code: outerHTML,
            },
          });
        }
      }}
    />
  );
}
