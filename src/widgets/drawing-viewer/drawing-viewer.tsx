"use client";

import { useState } from "react";
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

// 레이어 색상: 각 오버레이마다 다른 색상 사용
const layerColors = [
  { fill: "rgba(255, 0, 0, 0.1)", stroke: "#ff0000" }, // Red
  { fill: "rgba(0, 0, 255, 0.1)", stroke: "#0000ff" }, // Blue
  { fill: "rgba(0, 128, 0, 0.1)", stroke: "#008000" }, // Green
  { fill: "rgba(255, 128, 0, 0.1)", stroke: "#ff8000" }, // Orange
  { fill: "rgba(128, 0, 128, 0.1)", stroke: "#800080" }, // Purple
];

type DrawingViewerProps = {
  data: ParsedDrawingData;
  selectedIds: Set<string>;
  visibleIds: Set<string>;
  onSelect: (id: string, ctrlKey: boolean) => void;
};

const DrawingViewer = ({ data, selectedIds, visibleIds, onSelect }: DrawingViewerProps) => {
  const [baseSize, setBaseSize] = useState({ width: 1600, height: 1000 });

  // 선택된 노드들 추출
  const selectedNodes = Array.from(selectedIds)
    .map((id) => data.tree.nodes[id])
    .filter((node) => !!node);

  // 주 선택 노드 (첫 번째 또는 가장 상위)
  const primarySelectedId = Array.from(selectedIds)[0];
  const primaryNode = data.tree.nodes[primarySelectedId];

  // 기본 도면 찾기
  let baseImage: string | undefined = undefined;
  let drawingNode = undefined;

  if (primaryNode?.kind === "drawing") {
    baseImage = primaryNode.image;
    drawingNode = primaryNode;
  } else if (primaryNode?.kind === "discipline") {
    baseImage =
      primaryNode.imageTransform?.relativeTo ?? primaryNode.image;
    drawingNode = data.tree.nodes[`drawing:${primaryNode.drawingId}`];
  } else if (primaryNode?.kind === "region") {
    const parentDiscipline = data.tree.nodes[primaryNode.parentId ?? ""];
    if (parentDiscipline && parentDiscipline.kind === "discipline") {
      baseImage =
        parentDiscipline.imageTransform?.relativeTo ??
        parentDiscipline.image;
      drawingNode = data.tree.nodes[
        `drawing:${parentDiscipline.drawingId}`
      ] as any;
    }
  } else if (primaryNode?.kind === "revision") {
    const revisionEntry = data.revisions.find(
      (entry) => entry.id === primaryNode.id
    );
    if (revisionEntry) {
      baseImage = revisionEntry.parentImage ?? revisionEntry.image;
    }
  }

  if (!baseImage && drawingNode && "image" in drawingNode) {
    baseImage = (drawingNode as any).image;
  }

  // 모든 선택된 discipline의 오버레이 정보 수집
  type OverlayInfo = {
    nodeId: string;
    disciplineName: string;
    polygon?: { vertices?: Array<[number, number] | number[]> };
    colorIndex: number;
  };

  const overlays: OverlayInfo[] = [];
  const disciplineSet = new Set<string>(); // 중복 제거용

  selectedNodes.forEach((node, index) => {
    let disciplineNode = node;
    let regionNode = undefined;

    if (node.kind === "region") {
      regionNode = node;
      disciplineNode = data.tree.nodes[node.parentId ?? ""];
    } else if (node.kind === "discipline") {
      disciplineNode = node;
    } else if (node.kind === "revision") {
      const revEntry = data.revisions.find((entry) => entry.id === node.id);
      if (revEntry) {
        overlays.push({
          nodeId: node.id,
          disciplineName: `${revEntry.discipline} (Rev ${revEntry.version})`,
          polygon: revEntry.polygon,
          colorIndex: index % layerColors.length,
        });
      }
      return;
    } else if (node.kind === "drawing") {
      return; // Drawing 노드는 오버레이하지 않음
    }

    if (
      disciplineNode &&
      disciplineNode.kind === "discipline"
    ) {
      const disciplineId = disciplineNode.id;
      if (!disciplineSet.has(disciplineId)) {
        disciplineSet.add(disciplineId);
        overlays.push({
          nodeId: disciplineNode.id,
          disciplineName: disciplineNode.name,
          polygon: disciplineNode.polygon,
          colorIndex: overlays.length % layerColors.length,
        });
      }
    }
  });

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
                primarySelectedId === region.id
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
                      layerColors[overlay.colorIndex % layerColors.length];

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
                  layerColors[overlay.colorIndex % layerColors.length];
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
