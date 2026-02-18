import { cn } from "@/shared/lib";

interface MarkupToolsPanelProps {
  markupTool: "pen" | "eraser" | "line" | "rect" | "circle" | "text";
  markupColor: string;
  markupLineWidth: number;
  onToolChange: (
    tool: "pen" | "eraser" | "line" | "rect" | "circle" | "text",
  ) => void;
  onColorChange: (color: string) => void;
  onLineWidthChange: (width: number) => void;
  onUndo: () => void;
  onClear: () => void;
  canUndo?: boolean;
}

export const MarkupToolsPanel = ({
  markupTool,
  markupColor,
  markupLineWidth,
  onToolChange,
  onColorChange,
  onLineWidthChange,
  onUndo,
  onClear,
  canUndo,
}: MarkupToolsPanelProps) => {
  const tools = ["pen", "eraser", "line", "rect", "circle", "text"] as const;

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-md border border-gray-200 flex-none">
      <div className="text-xs text-gray-600 font-medium mb-2 w-full">
        💡 마크업 팁: Shift + 드래그로 도면을 이동할 수 있습니다
      </div>

      {/* 도구 선택 */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold">도구:</span>
        {tools.map((tool) => (
          <button
            key={tool}
            onClick={() => onToolChange(tool)}
            className={cn(
              "px-2 py-1 text-xs rounded border transition",
              markupTool === tool
                ? "bg-gray-700 text-white border-gray-700"
                : "bg-white text-black border-gray-300 hover:border-gray-700",
            )}
            title={tool}
            type="button"
          >
            {tool === "pen" && "✏️ 펜"}
            {tool === "eraser" && "🧹 지우개"}
            {tool === "line" && "📏 선"}
            {tool === "rect" && "▭ 사각형"}
            {tool === "circle" && "⭕ 원"}
            {tool === "text" && "📝 텍스트"}
          </button>
        ))}
      </div>

      <span className="text-black/30">|</span>

      {/* 색상 선택 */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold">색상:</span>
        <input
          type="color"
          value={markupColor}
          onChange={(e) => onColorChange(e.target.value)}
          className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
          title="색상 선택"
        />
      </div>

      {/* 선 두께 */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold">선 두께:</span>
        <input
          type="range"
          min="1"
          max="10"
          value={markupLineWidth}
          onChange={(e) => onLineWidthChange(parseInt(e.target.value))}
          className="w-24"
          title="선 두께 조정"
        />
        <span className="text-xs">{markupLineWidth}px</span>
      </div>

      <span className="text-black/30">|</span>

      {/* 액션 버튼 */}
      <button
        onClick={onUndo}
        className="px-2 py-1 text-xs font-semibold bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:opacity-50"
        type="button"
        title="되돌리기 (Ctrl+Z)"
        disabled={!canUndo}
      >
        ↶ 취소
      </button>

      <button
        onClick={onClear}
        className="px-2 py-1 text-xs font-semibold bg-red-500 text-white rounded hover:bg-red-600 transition"
        type="button"
        title="모든 마크업 삭제"
      >
        🗑️ 전체 삭제
      </button>
    </div>
  );
};
