import { createWindow } from "@/lib/createWindow";

export function SettingsLink() {
  return (
    <a
      onClick={(e) => {
        e.preventDefault();
        createWindow({ title: "Settings", program: { type: "settings" } });
      }}
    >
      Settings
    </a>
  );
}
