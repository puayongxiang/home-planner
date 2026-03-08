"use client";

import { useRef, useEffect, useCallback } from "react";
import { Stroke, DrawTool } from "@/lib/types";

interface AnnotationCanvasProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  annotations: Stroke[];
  isDrawMode: boolean;
  currentColor: string;
  currentWidth: number;
  currentTool: DrawTool;
  onStrokeAdd: (stroke: Stroke) => void;
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke, w: number, h: number) {
  if (stroke.points.length < 2) return;

  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const tool = stroke.tool || "pen";

  if (tool === "highlight") {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = stroke.width * 4;
    ctx.beginPath();
    const first = stroke.points[0];
    ctx.moveTo(first.x * w, first.y * h);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x * w, stroke.points[i].y * h);
    }
    ctx.stroke();
    ctx.restore();
  } else if (tool === "circle") {
    const p0 = stroke.points[0];
    const p1 = stroke.points[stroke.points.length - 1];
    const cx = ((p0.x + p1.x) / 2) * w;
    const cy = ((p0.y + p1.y) / 2) * h;
    const rx = Math.abs(p1.x - p0.x) / 2 * w;
    const ry = Math.abs(p1.y - p0.y) / 2 * h;
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (tool === "rect") {
    const p0 = stroke.points[0];
    const p1 = stroke.points[stroke.points.length - 1];
    const x = Math.min(p0.x, p1.x) * w;
    const y = Math.min(p0.y, p1.y) * h;
    const rw = Math.abs(p1.x - p0.x) * w;
    const rh = Math.abs(p1.y - p0.y) * h;
    ctx.beginPath();
    ctx.rect(x, y, rw, rh);
    ctx.stroke();
  } else {
    // pen
    ctx.beginPath();
    const first = stroke.points[0];
    ctx.moveTo(first.x * w, first.y * h);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x * w, stroke.points[i].y * h);
    }
    ctx.stroke();
  }
}

export default function AnnotationCanvas({
  containerRef,
  annotations,
  isDrawMode,
  currentColor,
  currentWidth,
  currentTool,
  onStrokeAdd,
}: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const startPoint = useRef<{ x: number; y: number } | null>(null);
  const currentPoints = useRef<{ x: number; y: number }[]>([]);

  const renderStrokes = useCallback(
    (strokes: Stroke[], preview?: Stroke) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const allStrokes = preview ? [...strokes, preview] : strokes;
      for (const stroke of allStrokes) {
        drawStroke(ctx, stroke, canvas.width, canvas.height);
      }
    },
    []
  );

  // Sync canvas size with container
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const sync = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      renderStrokes(annotations);
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef, annotations, renderStrokes]);

  useEffect(() => {
    renderStrokes(annotations);
  }, [annotations, renderStrokes]);

  const makePreview = useCallback(
    (points: { x: number; y: number }[]): Stroke => ({
      tool: currentTool,
      points,
      color: currentColor,
      width: currentWidth,
    }),
    [currentTool, currentColor, currentWidth]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawMode) return;
      e.stopPropagation();
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      isDrawing.current = true;
      canvas.setPointerCapture(e.pointerId);

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      startPoint.current = { x, y };
      currentPoints.current = [{ x, y }];
    },
    [isDrawMode]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing.current || !startPoint.current) return;
      e.stopPropagation();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      if (currentTool === "pen" || currentTool === "highlight") {
        currentPoints.current.push({ x, y });
        renderStrokes(annotations, makePreview(currentPoints.current));
      } else {
        // circle / rect — only need start + current
        renderStrokes(annotations, makePreview([startPoint.current, { x, y }]));
      }
    },
    [annotations, renderStrokes, currentTool, makePreview]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing.current || !startPoint.current) return;
      e.stopPropagation();
      isDrawing.current = false;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      let points: { x: number; y: number }[];
      if (currentTool === "pen" || currentTool === "highlight") {
        points = currentPoints.current;
      } else {
        points = [startPoint.current, { x, y }];
      }

      if (points.length >= 2) {
        onStrokeAdd({
          tool: currentTool,
          points,
          color: currentColor,
          width: currentWidth,
        });
      }
      currentPoints.current = [];
      startPoint.current = null;
    },
    [onStrokeAdd, currentColor, currentWidth, currentTool]
  );

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0"
      style={{
        pointerEvents: isDrawMode ? "auto" : "none",
        cursor: isDrawMode ? "crosshair" : "default",
        touchAction: "none",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    />
  );
}
