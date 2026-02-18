"use client";

import { useMemo } from "react";
import Image from "next/image";
import { cn } from "@/shared/lib";
import { SectionTitle } from "@/shared/ui";
import type { ParsedDrawingData } from "@/entities/drawing/model";
import { useDrawingViewer, useMarkup, useComparisonMode } from "./hooks";
import {
  MarkupToolsPanel,
  ComparisonControls,
  OverlaySummary,
} from "./components";
import type { OverlayInfo as OverlayType } from "./types";

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

type DrawingViewerProps = {
  data: ParsedDrawingData;
  selectedIds: Set<string>;
  visibleIds: Set<string>;
  selectedRevisionId?: string;
  isComparisonMode?: boolean;
  comparisonRevisions?: Set<string>;
  onSelect: (id: string, ctrlKey: boolean) => void;
  onToggleComparison?: () => void;
};

const DrawingViewer = ({
  data,
  selectedIds,
  visibleIds,
  isComparisonMode = false,
  comparisonRevisions = new Set(),
  onSelect,
  onToggleComparison,
}: DrawingViewerProps) => {
  // 커스텀 훅들
  const viewer = useDrawingViewer();
  const markup = useMarkup(
    viewer.viewerState.zoomLevel,
    viewer.viewerState.baseSize,
  );
  const comparison = useComparisonMode();

  // 기본 이미지 및 노드 정보
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
        image =
          parentDiscipline.imageTransform?.relativeTo ?? parentDiscipline.image;
        drawingNode = data.tree.nodes[`drawing:${parentDiscipline.drawingId}`];
      }
    } else if (primary?.kind === "revision") {
      const revEntry = data.revisions.find((entry) => entry.id === primary.id);
      if (revEntry) {
        image = revEntry.parentImage ?? revEntry.image;
      }
    }

    if (!image && drawingNode && "image" in drawingNode) {
      image = drawingNode.image as string | undefined;
    }

    return { selectedNodes: nodes, primaryNode: primary, baseImage: image };
  }, [selectedIds, data]);

  // 비교 모드 도면들
  const comparisonDrawings = useMemo(() => {
    const drawings: Array<{
      revisionId: string;
      image: string;
    }> = [];

    Array.from(comparisonRevisions).forEach((revisionId) => {
      const revEntry = data.revisions.find((entry) => entry.id === revisionId);
      if (revEntry) {
        const image = revEntry.parentImage ?? revEntry.image;
        drawings.push({ revisionId, image });
      }
    });

    return drawings;
  }, [comparisonRevisions, data]);

  // 오버레이 정보
  const overlays: OverlayType[] = useMemo(() => {
    const items: OverlayType[] = [];

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

      if (node.kind === "region") {
        items.push({
          nodeId: node.id,
          disciplineName: `${node.discipline} > ${node.name}`,
          polygon: node.polygon,
          colorIndex: items.length % LAYER_COLORS.length,
        });
      } else if (node.kind === "discipline") {
        items.push({
          nodeId: node.id,
          disciplineName: node.name,
          polygon: node.polygon,
          colorIndex: items.length % LAYER_COLORS.length,
        });
      }
    });

    return items;
  }, [selectedNodes, data.revisions]);

  // 표시 가능한 오버레이
  const visibleOverlays = overlays.filter((overlay) =>
    visibleIds.has(overlay.nodeId),
  );

  // Region 정보
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

  // 마크업 이벤트 핸들러
  const handleMarkupMouseDown = (e: React.MouseEvent) => {
    if (!markup.markupState.isMarkupMode || !markup.markupCanvasRef.current)
      return;

    const rect = markup.markupCanvasRef.current.getBoundingClientRect();
    const x =
      (e.clientX - rect.left) /
      viewer.viewerState.zoomLevel /
      viewer.viewerState.zoomLevel;
    const y =
      (e.clientY - rect.top) /
      viewer.viewerState.zoomLevel /
      viewer.viewerState.zoomLevel;

    markup.startDrawing(x, y);
  };

  const handleMarkupMouseMove = (e: React.MouseEvent) => {
    if (
      !markup.markupState.isMarkupMode ||
      !markup.markupState.isMarkupDrawing ||
      !markup.markupCanvasRef.current
    )
      return;

    const rect = markup.markupCanvasRef.current.getBoundingClientRect();
    const x =
      (e.clientX - rect.left) /
      viewer.viewerState.zoomLevel /
      viewer.viewerState.zoomLevel;
    const y =
      (e.clientY - rect.top) /
      viewer.viewerState.zoomLevel /
      viewer.viewerState.zoomLevel;

    if (markup.markupState.markupTool === "pen") {
      markup.drawPen(
        markup.markupState.markupDrawStart.x,
        markup.markupState.markupDrawStart.y,
        x,
        y,
      );
      markup.startDrawing(x, y);
    } else if (markup.markupState.markupTool === "eraser") {
      markup.eraseArea(x, y);
    }
  };

  const handleMarkupMouseUp = (e: React.MouseEvent) => {
    if (
      !markup.markupState.isMarkupMode ||
      !markup.markupState.isMarkupDrawing ||
      !markup.markupCanvasRef.current
    )
      return;

    const rect = markup.markupCanvasRef.current.getBoundingClientRect();
    const x =
      (e.clientX - rect.left) /
      viewer.viewerState.zoomLevel /
      viewer.viewerState.zoomLevel;
    const y =
      (e.clientY - rect.top) /
      viewer.viewerState.zoomLevel /
      viewer.viewerState.zoomLevel;

    if (markup.markupState.markupTool === "line") {
      markup.drawLine(
        markup.markupState.markupDrawStart.x,
        markup.markupState.markupDrawStart.y,
        x,
        y,
      );
    } else if (markup.markupState.markupTool === "rect") {
      markup.drawRect(
        markup.markupState.markupDrawStart.x,
        markup.markupState.markupDrawStart.y,
        x,
        y,
      );
    } else if (markup.markupState.markupTool === "circle") {
      markup.drawCircle(
        markup.markupState.markupDrawStart.x,
        markup.markupState.markupDrawStart.y,
        x,
        y,
      );
    } else if (markup.markupState.markupTool === "text") {
      const text = prompt("텍스트를 입력하세요:");
      if (text) {
        markup.drawText(
          markup.markupState.markupDrawStart.x,
          markup.markupState.markupDrawStart.y,
          text,
        );
      }
    }

    markup.endDrawing();
  };

  return (
    <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-black flex flex-col h-full min-h-0 overflow-hidden gap-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-3 flex-none">
        <SectionTitle>도면 뷰어</SectionTitle>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onToggleComparison}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition",
              isComparisonMode
                ? "bg-gray-700 text-white"
                : "bg-white text-black border-black",
            )}
            type="button"
            title={
              isComparisonMode
                ? "비교 모드 해제"
                : "비교 모드 (Ctrl+클릭으로 여러 리비전 선택 후 활성화)"
            }
          >
            {isComparisonMode ? "🔄 비교 중" : "비교"}
          </button>
          <span className="rounded-full border border-black px-3 py-1 text-xs font-semibold">
            {selectedNodes.length > 1
              ? `${selectedNodes.length}개 레이어`
              : "기본 렌더링"}
          </span>
          <div className="flex items-center gap-1 px-2 py-1 border border-black rounded-full text-xs">
            <button
              onClick={viewer.handleZoomOut}
              className="px-1 hover:font-bold"
              title="축소"
              type="button"
            >
              −
            </button>
            <span className="w-12 text-center font-semibold">
              {Math.round(viewer.viewerState.zoomLevel * 100)}%
            </span>
            <button
              onClick={viewer.handleZoomIn}
              className="px-1 hover:font-bold"
              title="확대"
              type="button"
            >
              +
            </button>
            <span className="mx-1 text-black/30">|</span>
            <button
              onClick={viewer.resetZoomAndPan}
              className="text-xs font-semibold hover:font-bold px-1"
              title="초기화"
              type="button"
            >
              1:1
            </button>
          </div>
          {/* 마크업 토글 */}
          <button
            onClick={() => {
              markup.toggleMarkupMode();
              if (!markup.markupState.isMarkupMode) {
                markup.initializeMarkupCanvas();
              }
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition",
              markup.markupState.isMarkupMode
                ? "bg-gray-700 text-white"
                : "bg-white text-black border-black",
            )}
            type="button"
            title={
              markup.markupState.isMarkupMode
                ? "마크업 모드 해제"
                : "마크업 모드 (그리기, 주석)"
            }
          >
            {markup.markupState.isMarkupMode ? "✏️ 마크업 중" : "✏️ 마크업"}
          </button>
        </div>
      </div>

      {/* 마크업 도구 패널 */}
      {markup.markupState.isMarkupMode && (
        <MarkupToolsPanel
          markupState={markup.markupState}
          onToolChange={markup.setMarkupTool}
          onColorChange={markup.setMarkupColor}
          onLineWidthChange={markup.setMarkupLineWidth}
          onUndo={markup.undo}
          onClear={markup.clear}
          historyLength={markup.markupHistoryRef.current.length}
        />
      )}

      {/* 비교 모드 정보 */}
      {isComparisonMode && (
        <div className="p-3 bg-blue-50 rounded-md border border-blue-200 text-xs text-blue-900 flex-none">
          <div className="font-semibold mb-2">🔄 비교 모드 사용 방법:</div>
          <ul className="list-disc list-inside space-y-1 text-blue-800">
            <li>
              <strong>여러 리비전 선택:</strong> 좌측 도면 목록에서{" "}
              <strong>Ctrl+클릭</strong>으로 비교할 리비전 2개 이상 선택
            </li>
            <li>
              <strong>각 도면 제어:</strong> 줌/팬(마우스 드래그), 투명도
              슬라이더로 개별 조정
            </li>
            <li>
              <strong>비교 해제:</strong> 비교 버튼 다시 클릭 또는 도면 1개만
              선택
            </li>
          </ul>
        </div>
      )}

      {/* Region 선택 버튼 */}
      {hasRegions ? (
        <div className="flex flex-wrap items-center gap-2 text-xs flex-none">
          <span className="font-semibold text-black">Region</span>
          <button
            className={cn(
              "rounded-full border px-3 py-1 font-semibold",
              !isRegionSelected
                ? "bg-gray-700 text-white"
                : "bg-white text-black",
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
                  : "bg-white text-black",
              )}
              type="button"
              onClick={() => onSelect(region.id, false)}
            >
              {region.name}
            </button>
          ))}
        </div>
      ) : null}

      {/* 캔버스 영역 */}
      <div className="flex-1 flex items-center justify-center rounded-md border border-black bg-gray-50 overflow-hidden min-h-0">
        {!baseImage && !isComparisonMode ? (
          <p className="text-sm text-black">선택된 도면이 없습니다.</p>
        ) : isComparisonMode && comparisonDrawings.length > 0 ? (
          // 비교 모드
          <div className="w-full h-full flex flex-col gap-2">
            <ComparisonControls
              comparisonDrawings={comparisonDrawings}
              data={data}
              getOpacity={comparison.getOpacity}
              setOpacity={comparison.setOpacity}
              getVisibility={comparison.getVisibility}
              toggleVisibility={comparison.toggleVisibility}
            />

            <div
              ref={viewer.canvasRef}
              className="relative flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
              onPointerDown={(e) =>
                viewer.handlePointerDown(e, markup.markupState.isMarkupMode)
              }
              onPointerMove={viewer.handlePointerMove}
              onPointerUp={viewer.stopPointerDrag}
              onPointerCancel={viewer.stopPointerDrag}
              onDragStart={(e) => e.preventDefault()}
              onDoubleClick={viewer.handleDoubleClick}
              onContextMenu={(e) => e.preventDefault()}
              onWheel={viewer.handleWheel}
              style={{
                userSelect: viewer.viewerState.isDragging ? "none" : "auto",
                touchAction: "none",
              }}
            >
              <div
                className="relative inline-block"
                style={{
                  maxWidth: viewer.viewerState.baseSize.width,
                  maxHeight: viewer.viewerState.baseSize.height,
                  transform: `translate(${viewer.viewerState.pan.x}px, ${viewer.viewerState.pan.y}px) scale(${viewer.viewerState.zoomLevel})`,
                  transformOrigin: "top left",
                  transition: viewer.viewerState.isDragging
                    ? "none"
                    : "transform 0.1s ease-out",
                }}
              >
                {comparisonDrawings.map((drawing, idx) => {
                  const isVisible = comparison.getVisibility(
                    drawing.revisionId,
                  );
                  if (!isVisible) return null;

                  return (
                    <Image
                      key={drawing.revisionId}
                      src={`/drawings/${encodeURIComponent(drawing.image)}`}
                      alt={`비교 도면 ${idx + 1}`}
                      className="block h-auto w-full border border-black"
                      style={{
                        position: idx === 0 ? undefined : "absolute",
                        top: 0,
                        left: 0,
                        opacity: comparison.getOpacity(drawing.revisionId),
                      }}
                      width={viewer.viewerState.baseSize.width}
                      height={viewer.viewerState.baseSize.height}
                      unoptimized
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      onLoadingComplete={(img) => {
                        if (idx === 0) {
                          viewer.setBaseSize({
                            width: img.naturalWidth,
                            height: img.naturalHeight,
                          });
                        }
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          // 단일 도면 뷰
          <div
            ref={viewer.canvasRef}
            className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
            onPointerDown={(e) =>
              viewer.handlePointerDown(e, markup.markupState.isMarkupMode)
            }
            onPointerMove={viewer.handlePointerMove}
            onPointerUp={viewer.stopPointerDrag}
            onPointerCancel={viewer.stopPointerDrag}
            onDragStart={(e) => e.preventDefault()}
            onDoubleClick={viewer.handleDoubleClick}
            onContextMenu={(e) => e.preventDefault()}
            onWheel={viewer.handleWheel}
            style={{
              userSelect: viewer.viewerState.isDragging ? "none" : "auto",
              touchAction: "none",
            }}
          >
            <div
              className="relative inline-block w-full"
              style={{
                maxWidth: viewer.viewerState.baseSize.width,
                maxHeight: viewer.viewerState.baseSize.height,
                transform: `translate(${viewer.viewerState.pan.x}px, ${viewer.viewerState.pan.y}px) scale(${viewer.viewerState.zoomLevel})`,
                transformOrigin: "top left",
                transition: viewer.viewerState.isDragging
                  ? "none"
                  : "transform 0.1s ease-out",
              }}
            >
              <Image
                src={`/drawings/${encodeURIComponent(baseImage || "")}`}
                alt="기준 도면"
                className="block h-auto w-full max-w-full border border-black"
                width={viewer.viewerState.baseSize.width}
                height={viewer.viewerState.baseSize.height}
                unoptimized
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                onLoadingComplete={(img) => {
                  viewer.setBaseSize({
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                  });
                }}
              />
              {visibleOverlays.length > 0 ? (
                <svg
                  className="pointer-events-none absolute left-0 top-0 h-full w-full"
                  viewBox={`0 0 ${viewer.viewerState.baseSize.width} ${viewer.viewerState.baseSize.height}`}
                  preserveAspectRatio="xMinYMin meet"
                >
                  {visibleOverlays.map((overlay) => {
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
              {/* 마크업 Canvas */}
              {markup.markupState.isMarkupMode && (
                <canvas
                  ref={markup.markupCanvasRef}
                  className="absolute left-0 top-0 cursor-crosshair"
                  onMouseDown={handleMarkupMouseDown}
                  onMouseMove={handleMarkupMouseMove}
                  onMouseUp={handleMarkupMouseUp}
                  onMouseLeave={handleMarkupMouseUp}
                  onWheel={viewer.handleWheel}
                  title="마크업: 그리기 | Shift+마우스드래그: 도면 이동"
                  style={{
                    pointerEvents: markup.markupState.isMarkupMode
                      ? "auto"
                      : "none",
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* 오버레이 요약 */}
      <OverlaySummary visibleOverlays={visibleOverlays} />
    </section>
  );
};

export default DrawingViewer;
