import { ProgramEntry } from "@/state/programs";
import { createWindow } from "./createWindow";
import { getSettings } from "./getSettings";

export async function spawn({
  description,
  settings,
  programsDispatch,
  base64Image,
}: {
  description: string;
  settings: ReturnType<typeof getSettings>;
  programsDispatch: (action: {
    type: "ADD_PROGRAM";
    payload: ProgramEntry;
  }) => void;
  base64Image?: string;
}) {
  let name = description;
  let imageUrl: string | undefined;

  if (name.length > 20) {
    const nameResp = await fetch("/api/name", {
      method: "POST",
      body: JSON.stringify({
        desc: description,
        settings: settings,
      }),
    });

    name = (await nameResp.json()).name;
  }

  // Handle image upload if base64Image is provided
  if (base64Image) {
    const imageFile = base64ToFile(base64Image, "image.png");
    const formData = new FormData();
    formData.append("image", imageFile);

    const uploadResp = await fetch("/api/upload-image", {
      method: "POST",
      body: formData,
    });

    if (uploadResp.ok) {
      imageUrl = (await uploadResp.json()).url;
    } else {
      console.error("Failed to upload image");
    }
  }

  const program: ProgramEntry = {
    id: name,
    prompt: description,
    name,
    imgPrompt: imageUrl,
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
}

// Helper function to convert base64 to File
function base64ToFile(base64: string, filename: string): File {
  const arr = base64.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}
