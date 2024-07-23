import { NextResponse } from "next/server";
import { put } from "@/lib/put";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("image") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  try {
    const fileName = `${Date.now()}-${file.name}`;
    const url = await put(fileName, file);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error processing file:", error);
    return NextResponse.json(
      { error: "Error processing file" },
      { status: 500 }
    );
  }
}
