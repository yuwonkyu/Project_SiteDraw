import { useState, useRef, useCallback } from "react";
import {
  mergeDrawingWithMarkup,
  downloadCanvasAsPNG,
} from "@/shared/lib/markup";

interface UseMarkupOptions {
  baseSize: { width: number; height: number };
  zoomLevel: number;
  pan: { x: number; y: number };
  baseImage?: string;
}

export const useMarkup = (options: UseMarkupOptions) => {
  const { baseSize, zoomLevel, pan, baseImage } = options;

  const [isMarkupMode, setIsMarkupMode] = useState(false);
  const [markupTool, setMarkupTool] = useState<
    "pen" | "eraser" | "line" | "rect" | "circle" | "text"
  >("pen");
  const [markupColor, setMarkupColor] = useState("#ff0000");
  const [markupLineWidth, setMarkupLineWidth] = useState(2);
  const [isMarkupDrawing, setIsMarkupDrawing] = useState(false);
  const [markupDrawStart, setMarkupDrawStart] = useState({ x: 0, y: 0 });

  const markupCanvasRef = useRef<HTMLCanvasElement>(null);
  const markupCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const markupHistoryRef = useRef<ImageData[]>([]);

  /**
   * 마크업 캔버스 초기화
   */
  const initializeMarkupCanvas = useCallback(() => {
    const canvas = markupCanvasRef.current;
    if (!canvas) return;

    const scaledWidth = baseSize.width * zoomLevel;
    const scaledHeight = baseSize.height * zoomLevel;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // 기존 마크업 보존
    const oldWidth = canvas.width;
    const oldHeight = canvas.height;
    let imageData = null;

    if (oldWidth > 0 && oldHeight > 0) {
      imageData = ctx.getImageData(0, 0, oldWidth, oldHeight);
    }

    // Canvas 크기 변경
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;

    // 기존 마크업 복원
    if (imageData && (scaledWidth !== oldWidth || scaledHeight !== oldHeight)) {
      const scaleX = scaledWidth / oldWidth;
      const scaleY = scaledHeight / oldHeight;

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = oldWidth;
      tempCanvas.height = oldHeight;
      const tempCtx = tempCanvas.getContext("2d");
      if (tempCtx) {
        tempCtx.putImageData(imageData, 0, 0);
        ctx.scale(scaleX, scaleY);
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.resetTransform();
      }
    }

    markupCtxRef.current = ctx;
  }, [baseSize, zoomLevel]);

  /**
   * 마크업 저장
   */
  const saveMarkup = useCallback(async () => {
    const canvas = markupCanvasRef.current;
    if (!canvas) {
      alert("마크업이 없습니다");
      return;
    }

    try {
      if (!baseImage) {
        alert("도면 이미지를 찾을 수 없습니다");
        return;
      }

      const finalCanvas = await mergeDrawingWithMarkup({
        baseSize,
        zoomLevel,
        pan,
        markupCanvas: canvas,
        drawingImageUrl: baseImage.includes("/")
          ? baseImage
          : `/drawings/${encodeURIComponent(baseImage)}`,
      });

      downloadCanvasAsPNG(
        finalCanvas,
        `drawing_with_markup_${new Date().getTime()}.png`,
      );

      alert("✓ 저장되었습니다!");
    } catch (error) {
      console.error("마크업 저장 실패:", error);
      alert(
        "저장 실패: " +
          (error instanceof Error ? error.message : "알 수 없는 오류"),
      );
    }
  }, [baseSize, zoomLevel, pan, baseImage]);

  /**
   * 마크업 취소 (Undo)
   */
  const undoMarkup = useCallback(() => {
    if (markupHistoryRef.current.length === 0) return;

    const canvas = markupCanvasRef.current;
    const ctx = markupCtxRef.current;
    if (!canvas || !ctx) return;

    markupHistoryRef.current.pop();
    const prevState =
      markupHistoryRef.current[markupHistoryRef.current.length - 1];

    if (prevState) {
      ctx.putImageData(prevState, 0, 0);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  /**
   * 마크업 전체 삭제
   */
  const clearMarkup = useCallback(() => {
    const canvas = markupCanvasRef.current;
    const ctx = markupCtxRef.current;
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    markupHistoryRef.current = [];
  }, []);

  /**
   * 마크업 상태 저장 (히스토리)
   */
  const saveMarkupState = useCallback(() => {
    const canvas = markupCanvasRef.current;
    const ctx = markupCtxRef.current;
    if (!canvas || !ctx) return;

    if (markupHistoryRef.current.length >= 20) {
      markupHistoryRef.current.shift();
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    markupHistoryRef.current.push(imageData);
  }, []);

  return {
    // 상태
    isMarkupMode,
    markupTool,
    markupColor,
    markupLineWidth,
    isMarkupDrawing,
    markupDrawStart,

    // Refs
    markupCanvasRef,
    markupCtxRef,
    markupHistoryRef,

    // 함수
    setIsMarkupMode,
    setMarkupTool,
    setMarkupColor,
    setMarkupLineWidth,
    setIsMarkupDrawing,
    setMarkupDrawStart,
    initializeMarkupCanvas,
    saveMarkup,
    undoMarkup,
    clearMarkup,
    saveMarkupState,
  };
};
