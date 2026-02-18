import type { OverlayInfo } from "../types";

const LAYER_COLORS = [
  { fill: "rgba(255, 0, 0, 0.1)", stroke: "#ff0000" },
  { fill: "rgba(0, 0, 255, 0.1)", stroke: "#0000ff" },
  { fill: "rgba(0, 128, 0, 0.1)", stroke: "#008000" },
  { fill: "rgba(255, 128, 0, 0.1)", stroke: "#ff8000" },
  { fill: "rgba(128, 0, 128, 0.1)", stroke: "#800080" },
] as const;

type OverlaySummaryProps = {
  visibleOverlays: OverlayInfo[];
};

export const OverlaySummary = ({ visibleOverlays }: OverlaySummaryProps) => {
  return (
    <div className="flex-none overflow-y-auto max-h-24">
      {visibleOverlays.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-black">
            활성 오버레이 ({visibleOverlays.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {visibleOverlays.map((overlay) => {
              const color = LAYER_COLORS[overlay.colorIndex % LAYER_COLORS.length];
              return (
                <div
                  key={overlay.nodeId}
                  className="flex items-center gap-2 rounded-full border border-black px-2 py-1 text-xs"
                  style={{ borderColor: color.stroke }}
                >
                  <div
                    className="h-3 w-3 rounded-sm"
                    style={
                      { backgroundColor: color.stroke } as React.CSSProperties
                    }
                  />
                  <span>{overlay.disciplineName}</span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-600">
            다중 도면을 색상으로 구분하여 표시합니다.
          </p>
        </div>
      ) : (
        <p className="text-xs text-gray-600">선택된 오버레이가 없습니다.</p>
      )}
    </div>
  );
};
