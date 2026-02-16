"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { cn } from "@/shared/lib";
import { SectionTitle } from "@/shared/ui";
import type { ParsedDrawingData } from "@/entities/drawing/model";

const toPoints = (vertices?: Array<[number, number] | number[]>) => {
  if (!vertices || vertices.length === 0) {
    return "";
  }
  return vertices
    .filter((vertex) => vertex.length >= 2)
    .map(([x, y]) => `${x},${y}`)
    .join(" ");
};

const LAYER_COLORS = [
  { fill: "rgba(255, 0, 0, 0.1)", stroke: "#ff0000" },
  { fill: "rgba(0, 0, 255, 0.1)", stroke: "#0000ff" },
  { fill: "rgba(0, 128, 0, 0.1)", stroke: "#008000" },
  { fill: "rgba(255, 128, 0, 0.1)", stroke: "#ff8000" },
  { fill: "rgba(128, 0, 128, 0.1)", stroke: "#800080" },
] as const;

type OverlayInfo = {
  nodeId: string;
  disciplineName: string;
  polygon?: { vertices?: Array<[number, number] | number[]> };
  colorIndex: number;
};

type DrawingViewerProps = {
  data: ParsedDrawingData;
  selectedIds: Set<string>;
  visibleIds: Set<string>;
  onSelect: (id: string, ctrlKey: boolean) => void;
};

const DrawingViewer = ({ data, selectedIds, visibleIds, onSelect }: DrawingViewerProps) => {
  const [baseSize, setBaseSize] = useState({ width: 1600, height: 1000 });

  const { selectedNodes, primaryNode, baseImage } = useMemo(() => {
    const nodes = Array.from(selectedIds)
      .map((id) => data.tree.nodes[id])
      .filter((node) => !!node);

    const primaryId = Array.from(selectedIds)[0];
    const primary = data.tree.nodes[primaryId];

    let image: string | undefined;
    let drawingNode = undefined;

    if (primary?.kind === "drawing") {
      image = primary.image;
      drawingNode = primary;
    } else if (primary?.kind === "discipline") {
      image = primary.imageTransform?.relativeTo ?? primary.image;
      drawingNode = data.tree.nodes[`drawing:${primary.drawingId}`];
    } else if (primary?.kind === "region") {
      const parentDiscipline = data.tree.nodes[primary.parentId ?? ""];
      if (parentDiscipline?.kind === "discipline") {
        image = parentDiscipline.imageTransform?.relativeTo ?? parentDiscipline.image;
        drawingNode = data.tree.nodes[`drawing:${parentDiscipline.drawingId}`];
      }
    } else if (primary?.kind === "revision") {
      const revEntry = data.revisions.find((entry) => entry.id === primary.id);
      if (revEntry) {
        image = revEntry.parentImage ?? revEntry.image;
      }
    }

    if (!image && drawingNode && "image" in drawingNode) {
      image = (drawingNode as any).image;
    }

    return { selectedNodes: nodes, primaryNode: primary, baseImage: image };
  }, [selectedIds, data]);

  const overlays: OverlayInfo[] = useMemo(() => {
    const items: OverlayInfo[] = [];
    const disciplineSet = new Set<string>();

    selectedNodes.forEach((node, index) => {
      if (node.kind === "drawing") return;

      if (node.kind === "revision") {
        const revEntry = data.revisions.find((entry) => entry.id === node.id);
        if (revEntry) {
          items.push({
            nodeId: node.id,
            disciplineName: `${revEntry.discipline} (Rev ${revEntry.version})`,
            polygon: revEntry.polygon,
            colorIndex: index % LAYER_COLORS.length,
          });
        }
        return;
      }

      let disciplineNode = node.kind === "region"
        ? data.tree.nodes[node.parentId ?? ""]
        : node;

      if (disciplineNode?.kind === "discipline" && !disciplineSet.has(disciplineNode.id)) {
        disciplineSet.add(disciplineNode.id);
        items.push({
          nodeId: disciplineNode.id,
          disciplineName: disciplineNode.name,
          polygon: disciplineNode.polygon,
          colorIndex: items.length % LAYER_COLORS.length,
        });
      }
    });

    return items;
  }, [selectedNodes, data.revisions]);

  // visibleIds로 필터링
  const visibleOverlays = overlays.filter((overlay) =>
    visibleIds.has(overlay.nodeId)
  );

  // Region 영역 처리
  const parentNode =
    primaryNode?.kind === "region"
      ? data.tree.nodes[primaryNode.parentId ?? ""]
      : undefined;
  const disciplineNode =
    primaryNode?.kind === "discipline"
      ? primaryNode
      : parentNode && parentNode.kind === "discipline"
      ? parentNode
      : undefined;

  const regionNodes = disciplineNode
    ? disciplineNode.children
        .map((childId) => data.tree.nodes[childId])
        .filter((node) => !!node && node.kind === "region")
    : [];
  const isRegionSelected = primaryNode?.kind === "region";
  const hasRegions = regionNodes.length > 0;

  return (
    <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-black">
      <div className="flex items-center justify-between">
        <SectionTitle>도면 뷰어</SectionTitle>
        <span className="rounded-full border border-black px-3 py-1 text-xs font-semibold">
          {selectedNodes.length > 1 ? `${selectedNodes.length}개 레이어` : "기본 렌더링"}
        </span>
      </div>
      {hasRegions ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-black">Region</span>
          <button
            className={cn(
              "rounded-full border px-3 py-1 font-semibold",
              !isRegionSelected
                ? "bg-gray-700 text-white"
                : "bg-white text-black"
            )}
            type="button"
            onClick={() =>
              disciplineNode ? onSelect(disciplineNode.id, false) : undefined
            }
          >
            전체
          </button>
          {regionNodes.map((region) => (
            <button
              key={region.id}
              className={cn(
                "rounded-full border px-3 py-1 font-semibold",
                primaryNode?.id === region.id
                  ? "bg-gray-700 text-white"
                  : "bg-white text-black"
              )}
              type="button"
              onClick={() => onSelect(region.id, false)}
            >
              {region.name}
            </button>
          ))}
        </div>
      ) : null}
      <div className="mt-4 flex min-h-105 items-center justify-center rounded-md border border-black bg-gray-50">
        {!baseImage ? (
          <p className="text-sm text-black">선택된 도면이 없습니다.</p>
        ) : (
          <div className="relative max-h-130 w-full overflow-auto p-4">
            <div
              className="relative inline-block w-full"
              style={{ maxWidth: baseSize.width, maxHeight: baseSize.height }}
            >
              <Image
                src={`/drawings/${baseImage}`}
                alt="기준 도면"
                className="block h-auto w-full max-w-full border border-black"
                width={baseSize.width}
                height={baseSize.height}
                unoptimized
                onLoadingComplete={(img) => {
                  setBaseSize({
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                  });
                }}
              />
              {visibleOverlays.length > 0 ? (
                <svg
                  className="pointer-events-none absolute left-0 top-0 h-full w-full"
                  viewBox={`0 0 ${baseSize.width} ${baseSize.height}`}
                  preserveAspectRatio="xMinYMin meet"
                >
                  {visibleOverlays.map((overlay, idx) => {
                    const points = toPoints(overlay.polygon?.vertices);
                    if (!points) return null;

                    const color =
                      LAYER_COLORS[overlay.colorIndex % LAYER_COLORS.length];

                    return (
                      <g key={overlay.nodeId}>
                        <polygon
                          points={points}
                          fill={color.fill}
                          stroke={color.stroke}
                          strokeWidth="2"
                          vectorEffect="non-scaling-stroke"
                        />
                      </g>
                    );
                  })}
                </svg>
              ) : null}
            </div>
          </div>
        )}
      </div>
      <div className="mt-3">
        {visibleOverlays.length > 0 ? (
          <div>
            <p className="text-xs font-semibold text-black mb-2">
              활성 오버레이 ({visibleOverlays.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {visibleOverlays.map((overlay, idx) => {
                const color =
                  LAYER_COLORS[overlay.colorIndex % LAYER_COLORS.length];
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
            <p className="mt-2 text-xs text-black">
              다중 도면을 색상으로 구분하여 표시합니다. Ctrl+Click으로 레이어를
              추가할 수 있습니다.
            </p>
          </div>
        ) : (
          <p className="text-xs text-black">선택된 오버레이가 없습니다.</p>
        )}
      </div>
    </section>
  );
};

export default DrawingViewer;
