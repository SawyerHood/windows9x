import { settingsAtom } from "@/state/settings";
import { getDefaultStore } from "jotai";
import { alert } from "./alert";

export function showUpsell() {
  alert({
    alertId: "OUT_OF_CREDITS",
    message: (
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <p>
          You&apos;ve used all your available tokens for high-quality
          generations with Claude 3.5 Sonnet.
        </p>
        <p>To continue using Windows 9X, you have two options:</p>
        <ul style={{ paddingLeft: "20px", marginTop: "4px" }}>
          <li>Purchase additional quality tokens</li>
          <li>Switch to our free model (with reduced capabilities)</li>
        </ul>
      </div>
    ),
    icon: "x",
    actions: [
      {
        label: "Use Free Model",
        callback: (close) => {
          getDefaultStore().set(settingsAtom, {
            ...getDefaultStore().get(settingsAtom),
            model: "cheap",
          });
          close();
        },
      },
      {
        label: "Get Tokens",
        callback: (close) => {
          const form = document.createElement("form");
          form.method = "POST";
          form.action = "/api/checkout";
          form.target = "_blank";
          document.body.appendChild(form);
          form.submit();
          document.body.removeChild(form);
          close();
        },
      },
    ],
  });
}
