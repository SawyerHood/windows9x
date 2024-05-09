const url = "https://sdk.photoroom.com/v1/segment";

export async function removeBackground(blob: Blob): Promise<Blob> {
  const formData = new FormData();
  formData.append("image_file", new File([blob], "image.png"));

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "X-Api-Key": process.env.PHOTOROOM_API_KEY,
    } as any,
    body: formData,
  });

  if (!response.ok) {
    console.error(response.json());
    throw new Error("Network response was not ok");
  }

  const imageBlob: Blob = await response.blob();

  return imageBlob;
}
