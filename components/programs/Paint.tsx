"use client";
import { useAtom } from "jotai";
import { windowAtomFamily } from "@/state/window";
import { useEffect, useRef, useState } from "react";

export function Paint({ id }: { id: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2); // Added state for stroke width
  const [windowState] = useAtom(windowAtomFamily(id));
  const bodySize = windowState.size;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = strokeWidth; // Use state for stroke width
  }, [strokeWidth]); // Added strokeWidth dependency

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.strokeStyle = color;
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <>
      <div className="field-row" style={{ justifyContent: "flex-end" }}>
        <button onClick={clearCanvas}>Clear</button>
        <button
        // onClick={() => {
        //   createWindow({
        //     title: "new program.exe",
        //     program: {
        //       type: "iframe",
        //       src: `/api/image?image=${encodeURIComponent(getJpegBase64())}`,
        //     },
        //     size: {
        //       width: 800,
        //       height: 600,
        //     },
        //     loading: true,
        //   });
        // }}
        >
          Make Real
        </button>
      </div>
      <div className="field-row" style={{ marginBottom: 8 }}>
        <label htmlFor="color">Color:</label>
        <input
          type="color"
          id="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        <label htmlFor="stroke-width">Stroke:</label>{" "}
        {/* Added label for stroke width */}
        <input
          type="range" // Added range input for stroke width
          id="stroke-width"
          min="1"
          max="10"
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
        />
      </div>
      <canvas
        ref={canvasRef}
        style={{ backgroundColor: "white" }}
        width={bodySize.width}
        height={bodySize.height}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
      />
    </>
  );
}
