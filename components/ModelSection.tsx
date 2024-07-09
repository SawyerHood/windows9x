import { trpc } from "@/lib/api/client";
import { useAtom } from "jotai";
import { settingsAtom } from "@/state/settings";

export function ModelSection() {
  const { data } = trpc.getTokens.useQuery();
  const [settings, setSettings] = useAtom(settingsAtom);

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings({ ...settings, model: e.target.value as "best" | "cheap" });
  };

  return (
    <fieldset style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <legend>Model</legend>
      <div className="field-row">
        <label>Model:</label>
        <select
          name="model"
          style={{ width: "100%" }}
          value={settings.model}
          onChange={handleModelChange}
        >
          <option value="best">Quality</option>
          <option value="cheap">Fast</option>
        </select>
      </div>
      <p className="field-row">
        Remaining Tokens:
        <span style={{ fontWeight: "bold", color: "green", marginLeft: "4px" }}>
          {data?.tokens}
        </span>
      </p>
      <p className="field-row">
        Note: Tokens are used for the Quality model. You get 10 free tokens
        every week for generations. You have unlimited uses for the Fast model.
      </p>
    </fieldset>
  );
}
