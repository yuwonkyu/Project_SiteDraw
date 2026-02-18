"use client";

import { useMemo, useState, useRef, useCallback, useEffect } from "react";
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
  selectedRevisionId?: string;
  isComparisonMode?: boolean;
  comparisonRevisions?: Set<string>;
  onSelect: (id: string, ctrlKey: boolean) => void;
  onToggleComparison?: () => void;
  onAddToComparison?: (revisionId: string) => void;
};

const DrawingViewer = ({ 
  data, 
  selectedIds, 
  visibleIds, 
  selectedRevisionId, 
  isComparisonMode = false,
  comparisonRevisions = new Set(),
  onSelect,
  onToggleComparison,
  onAddToComparison
}: DrawingViewerProps) => {
  const [baseSize, setBaseSize] = useState({ width: 1600, height: 1000 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // 비교 모드용 독립적인 줌/팬 상태
  const [comparisonZoomLevels, setComparisonZoomLevels] = useState<Record<string, number>>({});
  const [comparisonPans, setComparisonPans] = useState<Record<string, { x: number; y: number }>>({});
  const [comparisonDraggingState, setComparisonDraggingState] = useState<Record<string, boolean>>({});
  const [comparisonDragStart, setComparisonDragStart] = useState<Record<string, { x: number; y: number }>>({});
  const canvasRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

  // 비교 모드용 도면 데이터 수집
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

  // 줌/패닝 핸들러
  const handleWheel = useCallback((e: React.WheelEvent) => {
    // onWheel이 canvasRef에 바인드되어 있으므로 currentTarget은 항상 canvas div
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? 0.85 : 1.15;
    setZoomLevel(prev => Math.max(0.1, Math.min(5, prev * delta)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 좌클릭 또는 중간 마우스 버튼으로 드래그 시작 (줌인 상태에서 좌클릭 허용)
    if (e.button === 0 || e.button === 1) {
      if (e.button === 0 && e.ctrlKey) {
        // Ctrl+좌클릭: 항상 드래그
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      } else if (e.button === 0 && zoomLevel > 1) {
        // 좌클릭 + 줌인 상태: 드래그 활성화
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      } else if (e.button === 1) {
        // 중간 마우스: 항상 드래그
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    }
  }, [pan, zoomLevel]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
    }
    setIsDragging(false);
  }, [isDragging]);

  const resetZoomAndPan = useCallback(() => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(5, prev * 1.2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(0.1, prev / 1.2));
  }, []);

  // 비교 모드용 줌/팬 제어
  const getComparisonZoom = (revisionId: string) => comparisonZoomLevels[revisionId] ?? 1;
  const getComparisonPan = (revisionId: string) => comparisonPans[revisionId] ?? { x: 0, y: 0 };
  const getComparisonDragging = (revisionId: string) => comparisonDraggingState[revisionId] ?? false;

  const setComparisonZoom = (revisionId: string, zoom: number) => {
    setComparisonZoomLevels(prev => ({ ...prev, [revisionId]: zoom }));
  };

  const setComparisonPan = (revisionId: string, pan: { x: number; y: number }) => {
    setComparisonPans(prev => ({ ...prev, [revisionId]: pan }));
  };

  const setComparisonDragging = (revisionId: string, isDragging: boolean) => {
    setComparisonDraggingState(prev => ({ ...prev, [revisionId]: isDragging }));
  };

  const handleComparisonZoomIn = (revisionId: string) => {
    setComparisonZoom(revisionId, Math.min(5, getComparisonZoom(revisionId) * 1.2));
  };

  const handleComparisonZoomOut = (revisionId: string) => {
    setComparisonZoom(revisionId, Math.max(0.1, getComparisonZoom(revisionId) / 1.2));
  };

  const resetComparisonZoomAndPan = (revisionId: string) => {
    setComparisonZoom(revisionId, 1);
    setComparisonPan(revisionId, { x: 0, y: 0 });
  };

  // 캔버스에서의 wheel 이벤트 처리 - preventDefault로 페이지 스크롤 차단
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheelEvent = (e: WheelEvent) => {
      if (canvas.contains(e.target as Node)) {
        e.preventDefault();
      }
    };

    // capture phase에서 처리하여 더 확실하게 차단
    canvas.addEventListener("wheel", handleWheelEvent, { passive: false, capture: true });

    return () => {
      canvas.removeEventListener("wheel", handleWheelEvent, { capture: true } as any);
    };
  }, []);

  // 비교 모드 캔버스의 wheel 이벤트 처리
  useEffect(() => {
    const handleWheelEvent = (revisionId: string) => (e: WheelEvent) => {
      const canvas = canvasRefs.current[revisionId];
      if (canvas && canvas.contains(e.target as Node)) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.85 : 1.15;
        setComparisonZoom(revisionId, Math.max(0.1, Math.min(5, getComparisonZoom(revisionId) * delta)));
      }
    };

    const revisionIds = Array.from(comparisonRevisions);
    const listeners = revisionIds.map(revId => ({
      revId,
      handler: handleWheelEvent(revId)
    }));

    listeners.forEach(({ revId, handler }) => {
      const canvas = canvasRefs.current[revId];
      if (canvas) {
        canvas.addEventListener("wheel", handler, { passive: false, capture: true });
      }
    });

    return () => {
      listeners.forEach(({ revId, handler }) => {
        const canvas = canvasRefs.current[revId];
        if (canvas) {
          canvas.removeEventListener("wheel", handler, { capture: true } as any);
        }
      });
    };
  }, [comparisonRevisions, comparisonZoomLevels]);

  return (
    <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-black">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionTitle>도면 뷰어</SectionTitle>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onToggleComparison}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition",
              isComparisonMode
                ? "bg-gray-700 text-white"
                : "bg-white text-black border-black"
            )}
            type="button"
            title={isComparisonMode ? "비교 모드 해제" : "리비전 비교 모드"}
          >
            {isComparisonMode ? "🔄 비교 중" : "비교"}
          </button>
          <span className="rounded-full border border-black px-3 py-1 text-xs font-semibold">
            {selectedNodes.length > 1 ? `${selectedNodes.length}개 레이어` : "기본 렌더링"}
          </span>
          <div className="flex items-center gap-1 px-2 py-1 border border-black rounded-full text-xs">
            <button
              onClick={handleZoomOut}
              className="px-1 hover:font-bold"
              title="축소"
              type="button"
            >
              −
            </button>
            <span className="w-12 text-center font-semibold">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={handleZoomIn}
              className="px-1 hover:font-bold"
              title="확대"
              type="button"
            >
              +
            </button>
            <span className="mx-1 text-black/30">|</span>
            <button
              onClick={resetZoomAndPan}
              className="text-xs font-semibold hover:font-bold px-1"
              title="초기화"
              type="button"
            >
              1:1
            </button>
          </div>
        </div>
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
      <div className="mt-4 flex min-h-105 items-center justify-center rounded-md border border-black bg-gray-50 overflow-hidden">
        {!baseImage && !isComparisonMode ? (
          <p className="text-sm text-black">선택된 도면이 없습니다.</p>
        ) : isComparisonMode && comparisonDrawings.length > 0 ? (
          // 비교 모드 렌더링
          <div className="w-full h-full flex gap-2 p-2">
            {comparisonDrawings.map((drawing, idx) => (
              <div 
                key={drawing.revisionId}
                className="flex-1 flex flex-col gap-2"
              >
                {/* 비교 도면의 줌 컨트롤 */}
                <div className="flex items-center gap-1 px-2 py-1 border border-black rounded-full text-xs bg-white">
                  <button
                    onClick={() => handleComparisonZoomOut(drawing.revisionId)}
                    className="px-1 hover:font-bold"
                    title="축소"
                    type="button"
                  >
                    −
                  </button>
                  <span className="w-12 text-center font-semibold">
                    {Math.round(getComparisonZoom(drawing.revisionId) * 100)}%
                  </span>
                  <button
                    onClick={() => handleComparisonZoomIn(drawing.revisionId)}
                    className="px-1 hover:font-bold"
                    title="확대"
                    type="button"
                  >
                    +
                  </button>
                  <span className="mx-1 text-black/30">|</span>
                  <button
                    onClick={() => resetComparisonZoomAndPan(drawing.revisionId)}
                    className="text-xs font-semibold hover:font-bold px-1"
                    title="초기화"
                    type="button"
                  >
                    1:1
                  </button>
                </div>
                
                {/* 비교 도면 캔버스 */}
                <div 
                  ref={(el) => { if (el) canvasRefs.current[drawing.revisionId] = el; }}
                  className="flex-1 relative overflow-auto border border-black bg-gray-100 rounded cursor-grab active:cursor-grabbing"
                  onMouseDown={(e) => {
                    if (e.button === 0 && getComparisonZoom(drawing.revisionId) > 1) {
                      setComparisonDragging(drawing.revisionId, true);
                      setComparisonDragStart({
                        ...comparisonDragStart,
                        [drawing.revisionId]: {
                          x: e.clientX - getComparisonPan(drawing.revisionId).x,
                          y: e.clientY - getComparisonPan(drawing.revisionId).y
                        }
                      });
                    } else if (e.button === 0 && e.ctrlKey) {
                      setComparisonDragging(drawing.revisionId, true);
                      setComparisonDragStart({
                        ...comparisonDragStart,
                        [drawing.revisionId]: {
                          x: e.clientX - getComparisonPan(drawing.revisionId).x,
                          y: e.clientY - getComparisonPan(drawing.revisionId).y
                        }
                      });
                    } else if (e.button === 1) {
                      setComparisonDragging(drawing.revisionId, true);
                      setComparisonDragStart({
                        ...comparisonDragStart,
                        [drawing.revisionId]: {
                          x: e.clientX - getComparisonPan(drawing.revisionId).x,
                          y: e.clientY - getComparisonPan(drawing.revisionId).y
                        }
                      });
                    }
                  }}
                  onMouseMove={(e) => {
                    if (getComparisonDragging(drawing.revisionId)) {
                      e.preventDefault();
                      const dragStartPos = comparisonDragStart[drawing.revisionId];
                      if (dragStartPos) {
                        setComparisonPan(drawing.revisionId, {
                          x: e.clientX - dragStartPos.x,
                          y: e.clientY - dragStartPos.y
                        });
                      }
                    }
                  }}
                  onMouseUp={() => {
                    setComparisonDragging(drawing.revisionId, false);
                  }}
                  onMouseLeave={() => {
                    setComparisonDragging(drawing.revisionId, false);
                  }}
                  style={{ userSelect: getComparisonDragging(drawing.revisionId) ? "none" : "auto" }}
                >
                  <div
                    className="relative inline-block"
                    style={{
                      width: baseSize.width,
                      height: baseSize.height,
                      transform: `translate(${getComparisonPan(drawing.revisionId).x}px, ${getComparisonPan(drawing.revisionId).y}px) scale(${getComparisonZoom(drawing.revisionId)})`,
                      transformOrigin: "top left",
                      transition: getComparisonDragging(drawing.revisionId) ? "none" : "transform 0.1s ease-out"
                    }}
                  >
                    <Image
                      src={`/drawings/${drawing.image}`}
                      alt="비교 도면"
                      className="block h-auto w-full border border-black"
                      width={baseSize.width}
                      height={baseSize.height}
                      unoptimized
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div 
            ref={canvasRef}
            className="relative w-full h-full overflow-auto cursor-grab active:cursor-grabbing"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onContextMenu={(e) => e.preventDefault()}
            style={{ userSelect: isDragging ? "none" : "auto", touchAction: "none" }}
          >
            <div
              className="relative inline-block w-full"
              style={{ 
                maxWidth: baseSize.width, 
                maxHeight: baseSize.height,
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`,
                transformOrigin: "top left",
                transition: isDragging ? "none" : "transform 0.1s ease-out"
              }}
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
