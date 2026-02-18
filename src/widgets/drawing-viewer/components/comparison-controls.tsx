import type { ParsedDrawingData } from "@/entities/drawing/model";
import { cn } from "@/shared/lib";

type ComparisonDrawing = {
  revisionId: string;
  image: string;
};

type ComparisonControlsProps = {
  comparisonDrawings: ComparisonDrawing[];
  data: ParsedDrawingData;
  getOpacity: (revisionId: string) => number;
  setOpacity: (revisionId: string, opacity: number) => void;
  getVisibility: (revisionId: string) => boolean;
  toggleVisibility: (revisionId: string) => void;
};

export const ComparisonControls = ({
  comparisonDrawings,
  data,
  getOpacity,
  setOpacity,
  getVisibility,
  toggleVisibility,
}: ComparisonControlsProps) => {
  return (
    <div className="flex flex-wrap gap-2 p-2 bg-white border-b border-black">
      {comparisonDrawings.map((drawing, idx) => {
        const revEntry = data.revisions.find((r) => r.id === drawing.revisionId);
        const revisionName = revEntry
          ? `${revEntry.drawingName} - ${revEntry.revision}`
          : `도면 ${idx + 1}`;
        const isVisible = getVisibility(drawing.revisionId);

        return (
          <div
            key={drawing.revisionId}
            className="flex items-center gap-2 px-3 py-2 border border-black rounded text-xs bg-gray-50"
          >
            <button
              onClick={() => toggleVisibility(drawing.revisionId)}
              className={cn(
                "w-4 h-4 rounded border-2 flex items-center justify-center",
                isVisible
                  ? "bg-black border-black text-white"
                  : "bg-white border-gray-400",
              )}
              title={isVisible ? "레이어 숨기기" : "레이어 표시"}
              type="button"
            >
              {isVisible && "✓"}
            </button>

            <span className="font-semibold whitespace-nowrap">{revisionName}</span>

            <div className="flex items-center gap-1">
              <span className="text-gray-600">투명도:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={getOpacity(drawing.revisionId)}
                onChange={(e) => setOpacity(drawing.revisionId, parseFloat(e.target.value))}
                className="w-20 h-1"
                title="도면 투명도 조절"
              />
              <span className="w-8 text-right text-gray-600">
                {Math.round(getOpacity(drawing.revisionId) * 100)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
