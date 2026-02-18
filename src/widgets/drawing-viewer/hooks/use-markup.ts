"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MarkupTool, MarkupState } from "../types";

export const useMarkup = (
  zoomLevel: number,
  baseSize: { width: number; height: number },
) => {
  const [markupState, setMarkupState] = useState<MarkupState>({
    isMarkupMode: false,
    markupTool: "pen",
    markupColor: "#ff0000",
    markupLineWidth: 2,
    isMarkupDrawing: false,
    markupDrawStart: { x: 0, y: 0 },
  });

  const markupCanvasRef = useRef<HTMLCanvasElement>(null);
  const markupCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const markupHistoryRef = useRef<ImageData[]>([]);

  // Canvas 초기화
  const initializeMarkupCanvas = useCallback(() => {
    const canvas = markupCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let imageData = null;
    const oldWidth = canvas.width;
    const oldHeight = canvas.height;
    if (oldWidth > 0 && oldHeight > 0) {
      imageData = ctx.getImageData(0, 0, oldWidth, oldHeight);
    }

    const newWidth = baseSize.width * zoomLevel;
    const newHeight = baseSize.height * zoomLevel;
    canvas.width = newWidth;
    canvas.height = newHeight;

    markupCtxRef.current = ctx;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (
      imageData &&
      oldWidth > 0 &&
      oldHeight > 0 &&
      (newWidth !== oldWidth || newHeight !== oldHeight)
    ) {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = oldWidth;
      tempCanvas.height = oldHeight;
      const tempCtx = tempCanvas.getContext("2d");
      if (tempCtx) {
        tempCtx.putImageData(imageData, 0, 0);
        const scaleX = newWidth / oldWidth;
        const scaleY = newHeight / oldHeight;
        ctx.scale(scaleX, scaleY);
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.resetTransform();
      }
    }
  }, [baseSize.width, baseSize.height, zoomLevel]);

  // 마크업 모드 토글
  const toggleMarkupMode = useCallback(() => {
    setMarkupState((prev) => ({
      ...prev,
      isMarkupMode: !prev.isMarkupMode,
    }));
  }, []);

  // 도구 변경
  const setMarkupTool = useCallback((tool: MarkupTool) => {
    setMarkupState((prev) => ({
      ...prev,
      markupTool: tool,
    }));
  }, []);

  // 색상 변경
  const setMarkupColor = useCallback((color: string) => {
    setMarkupState((prev) => ({
      ...prev,
      markupColor: color,
    }));
  }, []);

  // 선 두께 변경
  const setMarkupLineWidth = useCallback((width: number) => {
    setMarkupState((prev) => ({
      ...prev,
      markupLineWidth: width,
    }));
  }, []);

  // 드로잉 시작
  const startDrawing = useCallback((x: number, y: number) => {
    if (!markupCtxRef.current || !markupCanvasRef.current) return;

    const canvas = markupCanvasRef.current;
    const ctx = markupCtxRef.current;

    markupHistoryRef.current.push(
      ctx.getImageData(0, 0, canvas.width, canvas.height),
    );
    if (markupHistoryRef.current.length > 20) {
      markupHistoryRef.current.shift();
    }

    setMarkupState((prev) => ({
      ...prev,
      isMarkupDrawing: true,
      markupDrawStart: { x, y },
    }));
  }, []);

  // 펜 드로잉
  const drawPen = useCallback(
    (startX: number, startY: number, endX: number, endY: number) => {
      if (!markupCtxRef.current) return;
      const ctx = markupCtxRef.current;

      ctx.strokeStyle = markupState.markupColor;
      ctx.lineWidth = markupState.markupLineWidth * zoomLevel;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(startX * zoomLevel, startY * zoomLevel);
      ctx.lineTo(endX * zoomLevel, endY * zoomLevel);
      ctx.stroke();
    },
    [markupState.markupColor, markupState.markupLineWidth, zoomLevel],
  );

  // 지우개
  const eraseArea = useCallback(
    (x: number, y: number) => {
      if (!markupCtxRef.current) return;
      const ctx = markupCtxRef.current;
      const eraserSize = markupState.markupLineWidth * 2 * zoomLevel;
      ctx.clearRect(
        x * zoomLevel - eraserSize,
        y * zoomLevel - eraserSize,
        eraserSize * 2,
        eraserSize * 2,
      );
    },
    [markupState.markupLineWidth, zoomLevel],
  );

  // 직선 그리기
  const drawLine = useCallback(
    (startX: number, startY: number, endX: number, endY: number) => {
      if (!markupCtxRef.current) return;
      const ctx = markupCtxRef.current;

      ctx.strokeStyle = markupState.markupColor;
      ctx.lineWidth = markupState.markupLineWidth * zoomLevel;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(startX * zoomLevel, startY * zoomLevel);
      ctx.lineTo(endX * zoomLevel, endY * zoomLevel);
      ctx.stroke();
    },
    [markupState.markupColor, markupState.markupLineWidth, zoomLevel],
  );

  // 사각형 그리기
  const drawRect = useCallback(
    (startX: number, startY: number, endX: number, endY: number) => {
      if (!markupCtxRef.current) return;
      const ctx = markupCtxRef.current;

      ctx.strokeStyle = markupState.markupColor;
      ctx.lineWidth = markupState.markupLineWidth * zoomLevel;
      const width = (endX - startX) * zoomLevel;
      const height = (endY - startY) * zoomLevel;
      ctx.strokeRect(startX * zoomLevel, startY * zoomLevel, width, height);
    },
    [markupState.markupColor, markupState.markupLineWidth, zoomLevel],
  );

  // 원 그리기
  const drawCircle = useCallback(
    (centerX: number, centerY: number, pointX: number, pointY: number) => {
      if (!markupCtxRef.current) return;
      const ctx = markupCtxRef.current;

      ctx.strokeStyle = markupState.markupColor;
      ctx.lineWidth = markupState.markupLineWidth * zoomLevel;
      const radius =
        Math.sqrt(
          Math.pow(pointX - centerX, 2) + Math.pow(pointY - centerY, 2),
        ) * zoomLevel;
      ctx.beginPath();
      ctx.arc(centerX * zoomLevel, centerY * zoomLevel, radius, 0, 2 * Math.PI);
      ctx.stroke();
    },
    [markupState.markupColor, markupState.markupLineWidth, zoomLevel],
  );

  // 텍스트 그리기
  const drawText = useCallback(
    (x: number, y: number, text: string) => {
      if (!markupCtxRef.current) return;
      const ctx = markupCtxRef.current;

      ctx.fillStyle = markupState.markupColor;
      ctx.font = `${Math.max(12, markupState.markupLineWidth * 6 * zoomLevel)}px Arial`;
      ctx.fillText(text, x * zoomLevel, y * zoomLevel);
    },
    [markupState.markupColor, markupState.markupLineWidth, zoomLevel],
  );

  // 되돌리기
  const undo = useCallback(() => {
    if (!markupCtxRef.current) return;

    const ctx = markupCtxRef.current;
    const previousState = markupHistoryRef.current.pop();
    if (previousState) {
      ctx.putImageData(previousState, 0, 0);
    }
  }, []);

  // 초기화
  const clear = useCallback(() => {
    if (!markupCanvasRef.current || !markupCtxRef.current) return;

    const canvas = markupCanvasRef.current;
    const ctx = markupCtxRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    markupHistoryRef.current = [];
  }, []);

  // 드로잉 종료
  const endDrawing = useCallback(() => {
    setMarkupState((prev) => ({
      ...prev,
      isMarkupDrawing: false,
    }));
  }, []);

  // Canvas 초기화 effect
  useEffect(() => {
    if (markupState.isMarkupMode) {
      initializeMarkupCanvas();
    }
  }, [baseSize, zoomLevel, markupState.isMarkupMode, initializeMarkupCanvas]);

  // Ctrl+Z 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "z" &&
        markupState.isMarkupMode
      ) {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [markupState.isMarkupMode, undo]);

  return {
    markupState,
    markupCanvasRef,
    markupCtxRef,
    markupHistoryRef,
    initializeMarkupCanvas,
    toggleMarkupMode,
    setMarkupTool,
    setMarkupColor,
    setMarkupLineWidth,
    startDrawing,
    drawPen,
    eraseArea,
    drawLine,
    drawRect,
    drawCircle,
    drawText,
    endDrawing,
    undo,
    clear,
  };
};
