import type { MarkupTool, MarkupState } from "../types";
import { cn } from "@/shared/lib";

type MarkupToolsPanelProps = {
  markupState: MarkupState;
  onToolChange: (tool: MarkupTool) => void;
  onColorChange: (color: string) => void;
  onLineWidthChange: (width: number) => void;
  onUndo: () => void;
  onClear: () => void;
  historyLength: number;
};

const TOOL_LABELS: Record<MarkupTool, string> = {
  pen: "✏️ 펜",
  eraser: "🧹 지우개",
  line: "📏 선",
  rect: "▭ 사각형",
  circle: "⭕ 원",
  text: "📝 텍스트",
};

export const MarkupToolsPanel = ({
  markupState,
  onToolChange,
  onColorChange,
  onLineWidthChange,
  onUndo,
  onClear,
  historyLength,
}: MarkupToolsPanelProps) => {
  const tools: MarkupTool[] = [
    "pen",
    "eraser",
    "line",
    "rect",
    "circle",
    "text",
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-md border border-gray-200 flex-none">
      <div className="text-xs text-gray-600 font-medium mb-2 w-full">
        💡 마크업 팁: Shift + 드래그로 도면을 이동할 수 있습니다
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold">도구:</span>
        {tools.map((tool) => (
          <button
            key={tool}
            onClick={() => onToolChange(tool)}
            className={cn(
              "px-2 py-1 text-xs rounded border transition",
              markupState.markupTool === tool
                ? "bg-gray-700 text-white border-gray-700"
                : "bg-white text-black border-gray-300 hover:border-gray-700",
            )}
            title={tool}
            type="button"
          >
            {TOOL_LABELS[tool]}
          </button>
        ))}
      </div>

      <span className="text-black/30">|</span>

      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold">색상:</span>
        <input
          type="color"
          value={markupState.markupColor}
          onChange={(e) => onColorChange(e.target.value)}
          className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
          title="색상 선택"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold">선 두께:</span>
        <input
          type="range"
          min="1"
          max="10"
          value={markupState.markupLineWidth}
          onChange={(e) => onLineWidthChange(parseInt(e.target.value))}
          className="w-24"
          title="선 두께 조정"
        />
        <span className="text-xs">{markupState.markupLineWidth}px</span>
      </div>

      <span className="text-black/30">|</span>

      <button
        onClick={onUndo}
        className="px-2 py-1 text-xs font-semibold bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        type="button"
        title="되돌리기 (Ctrl+Z)"
        disabled={historyLength === 0}
      >
        ↶ 취소
      </button>

      <button
        onClick={onClear}
        className="px-2 py-1 text-xs font-semibold bg-red-500 text-white rounded hover:bg-red-600 transition"
        type="button"
        title="그림 초기화"
      >
        🗑️ 초기화
      </button>
    </div>
  );
};
