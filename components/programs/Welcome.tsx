"use client";

import { useEffect } from "react";

export function Welcome({ id: _id }: { id: string }) {
  useEffect(() => {
    const audio = new Audio("/start.mp3");
    audio.play().catch((error) => {
      console.error("Error playing start.mp3:", error);
    });
  }, []);
  return <div>Welcome to Windows 9X</div>;
}
