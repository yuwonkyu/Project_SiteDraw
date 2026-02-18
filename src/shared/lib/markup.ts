/**
 * 마크업 저장 유틸리티
 * 도면 이미지와 마크업을 합치는 함수
 */

interface SaveMarkupOptions {
  baseSize: { width: number; height: number };
  zoomLevel: number;
  pan: { x: number; y: number };
  markupCanvas: HTMLCanvasElement;
  drawingImageUrl: string;
}

/**
 * 도면 이미지를 URL에서 Canvas로 변환
 */
export const loadImageToCanvas = (
  imageUrl: string,
): Promise<HTMLCanvasElement> => {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context 획득 실패"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };

    img.onerror = () => {
      reject(new Error("이미지 로드 실패"));
    };

    img.src = imageUrl;
  });
};

/**
 * 마크업 캔버스를 원본 좌표로 변환
 */
export const transformMarkupCanvas = (options: {
  markupCanvas: HTMLCanvasElement;
  baseSize: { width: number; height: number };
  zoomLevel: number;
  pan: { x: number; y: number };
}): HTMLCanvasElement => {
  const { markupCanvas, baseSize, zoomLevel, pan } = options;

  // 원본 크기의 투명한 캔버스 생성
  const transformedCanvas = document.createElement("canvas");
  transformedCanvas.width = baseSize.width;
  transformedCanvas.height = baseSize.height;
  const ctx = transformedCanvas.getContext("2d", { willReadFrequently: true });

  if (!ctx) return transformedCanvas;

  // zoom과 pan을 역변환하여 원본 좌표로 복원
  ctx.scale(1 / zoomLevel, 1 / zoomLevel);
  ctx.translate(-pan.x * zoomLevel, -pan.y * zoomLevel);

  // 마크업 캔버스 그리기
  ctx.drawImage(markupCanvas, 0, 0);

  return transformedCanvas;
};

/**
 * 도면과 마크업을 합치는 메인 함수
 */
export const mergeDrawingWithMarkup = async (
  options: SaveMarkupOptions,
): Promise<HTMLCanvasElement> => {
  const { baseSize, zoomLevel, pan, markupCanvas, drawingImageUrl } = options;

  // 최종 저장 캔버스
  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = baseSize.width;
  finalCanvas.height = baseSize.height;
  const finalCtx = finalCanvas.getContext("2d");

  if (!finalCtx) {
    throw new Error("Canvas context 획득 실패");
  }

  try {
    // 1. 도면 이미지 로드 및 그리기
    const drawingCanvas = await loadImageToCanvas(drawingImageUrl);
    finalCtx.drawImage(drawingCanvas, 0, 0, baseSize.width, baseSize.height);

    // 2. 마크업 변환 및 합치기
    const transformedMarkup = transformMarkupCanvas({
      markupCanvas,
      baseSize,
      zoomLevel,
      pan,
    });
    finalCtx.drawImage(transformedMarkup, 0, 0);

    return finalCanvas;
  } catch (error) {
    console.error("도면 합치기 실패:", error);
    throw error;
  }
};

/**
 * Canvas를 PNG로 다운로드
 */
export const downloadCanvasAsPNG = (
  canvas: HTMLCanvasElement,
  filename: string,
): void => {
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
