export type MarkupTool = "pen" | "eraser" | "line" | "rect" | "circle" | "text";

export type OverlayInfo = {
  nodeId: string;
  disciplineName: string;
  polygon?: { vertices?: Array<[number, number] | number[]> };
  colorIndex: number;
};

export type ViewerState = {
  baseSize: { width: number; height: number };
  zoomLevel: number;
  pan: { x: number; y: number };
  isDragging: boolean;
  dragStart: { x: number; y: number };
};

export type MarkupState = {
  isMarkupMode: boolean;
  markupTool: MarkupTool;
  markupColor: string;
  markupLineWidth: number;
  isMarkupDrawing: boolean;
  markupDrawStart: { x: number; y: number };
};

export type ComparisonModeState = {
  comparisonOpacities: Record<string, number>;
  comparisonVisibility: Record<string, boolean>;
};
