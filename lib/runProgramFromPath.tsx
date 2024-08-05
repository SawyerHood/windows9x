import { createWindow } from "@/lib/createWindow";
import { getFsManager } from "@/state/fsManager";

export async function runProgramFromPath(exePath: string): Promise<void> {
  try {
    const fsManager = await getFsManager();
    const exeFile = await fsManager.getFile(exePath, "deep");

    if (!exeFile || exeFile.type !== "file") {
      throw new Error("Invalid exe file path");
    }

    const exeContent = exeFile.content as string;
    const config = JSON.parse(exeContent);

    // Get the parent folder name
    const parentFolderName = exePath.split("/").slice(-2)[0];

    // Create a window for the program
    createWindow({
      title: parentFolderName,
      program: {
        type: "iframe",
        programID: parentFolderName,
      },
      icon: config.icon ?? undefined,
    });

    console.log("Running program:", parentFolderName);
  } catch (error) {
    console.error("Error running program:", error);
    throw error;
  }
}
