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
  const [baseSize, setBaseSize] = useState({ width: 1600, height: 1000 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const activePointerIdRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // 비교 모드용 투명도 및 표시 상태
  const [comparisonOpacities, setComparisonOpacities] = useState<
    Record<string, number>
  >({});
  const [comparisonVisibility, setComparisonVisibility] = useState<
    Record<string, boolean>
  >({});

  // 마크업 도구 상태
  const [isMarkupMode, setIsMarkupMode] = useState(false);
  const [markupTool, setMarkupTool] = useState<
    "pen" | "eraser" | "line" | "rect" | "circle" | "text"
  >("pen");
  const [markupColor, setMarkupColor] = useState("#ff0000");
  const [markupLineWidth, setMarkupLineWidth] = useState(2);
  const [isMarkupDrawing, setIsMarkupDrawing] = useState(false);
  const [markupDrawStart, setMarkupDrawStart] = useState({ x: 0, y: 0 });
  const markupCanvasRef = useRef<HTMLCanvasElement>(null);
  const markupCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const markupHistoryRef = useRef<ImageData[]>([]);

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

      // Region, Discipline 모두 표시
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

  // visibleIds로 필터링
  const visibleOverlays = overlays.filter((overlay) =>
    visibleIds.has(overlay.nodeId),
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

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // 마크업 중에는 Shift+좌클릭 또는 우클릭으로만 드래그 가능
      if (isMarkupMode && e.button === 0 && !e.shiftKey) return;

      // 좌클릭 또는 (마크업 모드에서 Shift+좌클릭)
      if (e.button !== 0) return;

      e.preventDefault();
      activePointerIdRef.current = e.pointerId;
      e.currentTarget.setPointerCapture(e.pointerId);

      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    },
    [pan, isMarkupMode],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging || activePointerIdRef.current !== e.pointerId) return;
      e.preventDefault();
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart],
  );

  const stopPointerDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (activePointerIdRef.current === e.pointerId) {
        e.currentTarget.releasePointerCapture(e.pointerId);
        activePointerIdRef.current = null;
      }
      if (isDragging) {
        e.preventDefault();
      }
      setIsDragging(false);
    },
    [isDragging],
  );

  const resetZoomAndPan = useCallback(() => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = useCallback(() => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = rect.width / 2 / zoomLevel; // 캔버스 중심 기준
    const mouseY = rect.height / 2 / zoomLevel;

    const newZoom = Math.min(5, zoomLevel * 1.2);
    const zoomRatio = newZoom / zoomLevel;

    setPan((prev) => ({
      x: prev.x - mouseX * (zoomRatio - 1),
      y: prev.y - mouseY * (zoomRatio - 1),
    }));
    setZoomLevel(newZoom);
  }, [zoomLevel]);

  const handleZoomOut = useCallback(() => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = rect.width / 2 / zoomLevel; // 캔버스 중심 기준
    const mouseY = rect.height / 2 / zoomLevel;

    const newZoom = Math.max(0.1, zoomLevel / 1.2);
    const zoomRatio = newZoom / zoomLevel;

    setPan((prev) => ({
      x: prev.x - mouseX * (zoomRatio - 1),
      y: prev.y - mouseY * (zoomRatio - 1),
    }));
    setZoomLevel(newZoom);
  }, [zoomLevel]);

  // 더블클릭 시 fit-to-screen
  const handleDoubleClick = useCallback(() => {
    if (!canvasRef.current) return;
    const container = canvasRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // 이미지를 컨테이너에 fit시킬 zoom 레벨 계산
    const zoomX = containerWidth / baseSize.width;
    const zoomY = containerHeight / baseSize.height;
    const fitZoom = Math.min(zoomX, zoomY, 1); // 최대 1.0 (원본 크기 이상 확대 안 함)

    setZoomLevel(fitZoom);
    setPan({ x: 0, y: 0 });
  }, [baseSize.width, baseSize.height]);

  const getComparisonOpacity = (revisionId: string) =>
    comparisonOpacities[revisionId] ?? 0.8;

  const setComparisonOpacity = (revisionId: string, opacity: number) => {
    setComparisonOpacities((prev) => ({
      ...prev,
      [revisionId]: Math.max(0, Math.min(1, opacity)),
    }));
  };

  const getComparisonVisibility = (revisionId: string) =>
    comparisonVisibility[revisionId] ?? true;

  const toggleComparisonVisibility = (revisionId: string) => {
    setComparisonVisibility((prev) => ({
      ...prev,
      [revisionId]: !(prev[revisionId] ?? true),
    }));
  };

  // 비교 모드 초기화: 모든 레이어 표시 및 투명도 기본값 설정
  useEffect(() => {
    if (!isComparisonMode) return;

    comparisonDrawings.forEach(({ revisionId }) => {
      if (!(revisionId in comparisonOpacities)) {
        setComparisonOpacities((prev) => ({
          ...prev,
          [revisionId]: 0.8,
        }));
      }
      if (!(revisionId in comparisonVisibility)) {
        setComparisonVisibility((prev) => ({
          ...prev,
          [revisionId]: true,
        }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comparisonDrawings, isComparisonMode]);

  // 마크업 Canvas 초기화 (기존 마크업 보존)
  const initializeMarkupCanvas = useCallback(() => {
    const canvas = markupCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 마크업이 있으면 이미지 데이터를 저장
    let imageData = null;
    const oldWidth = canvas.width;
    const oldHeight = canvas.height;
    if (oldWidth > 0 && oldHeight > 0) {
      imageData = ctx.getImageData(0, 0, oldWidth, oldHeight);
    }

    // 새 크기로 설정
    const newWidth = baseSize.width * zoomLevel;
    const newHeight = baseSize.height * zoomLevel;
    canvas.width = newWidth;
    canvas.height = newHeight;

    markupCtxRef.current = ctx;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // 마크업이 있으면 복원 (스케일 조정)
    if (
      imageData &&
      oldWidth > 0 &&
      oldHeight > 0 &&
      (newWidth !== oldWidth || newHeight !== oldHeight)
    ) {
      // 이미지 데이터를 새 크기에 맞게 조정
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = oldWidth;
      tempCanvas.height = oldHeight;
      const tempCtx = tempCanvas.getContext("2d");
      if (tempCtx) {
        tempCtx.putImageData(imageData, 0, 0);
        // 스케일 비율 계산
        const scaleX = newWidth / oldWidth;
        const scaleY = newHeight / oldHeight;
        ctx.scale(scaleX, scaleY);
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.resetTransform();
      }
    }
  }, [baseSize.width, baseSize.height, zoomLevel]);

  // 마크업 드로잉 시작
  const handleMarkupMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isMarkupMode || !markupCanvasRef.current || !markupCtxRef.current)
        return;

      const canvas = markupCanvasRef.current;
      const ctx = markupCtxRef.current;

      // 현재 상태를 히스토리에 저장
      markupHistoryRef.current.push(
        ctx.getImageData(0, 0, canvas.width, canvas.height),
      );
      // 히스토리 크기 제한 (최대 20개)
      if (markupHistoryRef.current.length > 20) {
        markupHistoryRef.current.shift();
      }

      const rect = canvas.getBoundingClientRect();
      // getBoundingClientRect()는 이미 transform이 적용된 절대 좌표를 반환
      // 캔버스 내 픽셀 좌표 = {화면 좌표 - 캔버스 위치} / zoom
      // 논리 좌표로 변환 = 캔버스 픽셀 좌표 / zoom
      const x = (e.clientX - rect.left) / zoomLevel / zoomLevel;
      const y = (e.clientY - rect.top) / zoomLevel / zoomLevel;

      setMarkupDrawStart({ x, y });
      setIsMarkupDrawing(true);
    },
    [isMarkupMode, zoomLevel],
  );

  // 마크업 드로잉 진행
  const handleMarkupMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (
        !isMarkupMode ||
        !isMarkupDrawing ||
        !markupCanvasRef.current ||
        !markupCtxRef.current
      )
        return;

      const canvas = markupCanvasRef.current;
      const ctx = markupCtxRef.current;
      const rect = canvas.getBoundingClientRect();
      // getBoundingClientRect()는 이미 transform이 적용된 절대 좌표를 반환
      // 캔버스 내 픽셀 좌표 = {화면 좌표 - 캔버스 위치} / zoom
      // 논리 좌표로 변환 = 캔버스 픽셀 좌표 / zoom
      const x = (e.clientX - rect.left) / zoomLevel / zoomLevel;
      const y = (e.clientY - rect.top) / zoomLevel / zoomLevel;

      if (markupTool === "pen") {
        ctx.strokeStyle = markupColor;
        ctx.lineWidth = markupLineWidth * zoomLevel; // zoom에 따라 선의 물리적 두께 조정
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(
          markupDrawStart.x * zoomLevel,
          markupDrawStart.y * zoomLevel,
        );
        ctx.lineTo(x * zoomLevel, y * zoomLevel);
        ctx.stroke();
        setMarkupDrawStart({ x, y });
      } else if (markupTool === "eraser") {
        const eraserSize = markupLineWidth * 2 * zoomLevel;
        ctx.clearRect(
          x * zoomLevel - eraserSize,
          y * zoomLevel - eraserSize,
          eraserSize * 2,
          eraserSize * 2,
        );
      }
    },
    [
      isMarkupMode,
      isMarkupDrawing,
      markupTool,
      markupColor,
      markupLineWidth,
      markupDrawStart,
      zoomLevel,
    ],
  );

  // 마크업 드로잉 종료
  const handleMarkupMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (
        !isMarkupMode ||
        !isMarkupDrawing ||
        !markupCanvasRef.current ||
        !markupCtxRef.current
      )
        return;

      const canvas = markupCanvasRef.current;
      const ctx = markupCtxRef.current;
      const rect = canvas.getBoundingClientRect();
      // getBoundingClientRect()는 이미 transform이 적용된 절대 좌표를 반환
      // 캔버스 내 픽셀 좌표 = {화면 좌표 - 캔버스 위치} / zoom
      // 논리 좌표로 변환 = 캔버스 픽셀 좌표 / zoom
      const x = (e.clientX - rect.left) / zoomLevel / zoomLevel;
      const y = (e.clientY - rect.top) / zoomLevel / zoomLevel;

      if (markupTool === "line") {
        ctx.strokeStyle = markupColor;
        ctx.lineWidth = markupLineWidth * zoomLevel;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(
          markupDrawStart.x * zoomLevel,
          markupDrawStart.y * zoomLevel,
        );
        ctx.lineTo(x * zoomLevel, y * zoomLevel);
        ctx.stroke();
      } else if (markupTool === "rect") {
        ctx.strokeStyle = markupColor;
        ctx.lineWidth = markupLineWidth * zoomLevel;
        const width = (x - markupDrawStart.x) * zoomLevel;
        const height = (y - markupDrawStart.y) * zoomLevel;
        ctx.strokeRect(
          markupDrawStart.x * zoomLevel,
          markupDrawStart.y * zoomLevel,
          width,
          height,
        );
      } else if (markupTool === "circle") {
        ctx.strokeStyle = markupColor;
        ctx.lineWidth = markupLineWidth * zoomLevel;
        const radius =
          Math.sqrt(
            Math.pow(x - markupDrawStart.x, 2) +
              Math.pow(y - markupDrawStart.y, 2),
          ) * zoomLevel;
        ctx.beginPath();
        ctx.arc(
          markupDrawStart.x * zoomLevel,
          markupDrawStart.y * zoomLevel,
          radius,
          0,
          2 * Math.PI,
        );
        ctx.stroke();
      } else if (markupTool === "text") {
        const text = prompt("텍스트를 입력하세요:");
        if (text) {
          ctx.fillStyle = markupColor;
          ctx.font = `${Math.max(12, markupLineWidth * 6 * zoomLevel)}px Arial`;
          ctx.fillText(
            text,
            markupDrawStart.x * zoomLevel,
            markupDrawStart.y * zoomLevel,
          );
        }
      }

      setIsMarkupDrawing(false);
    },
    [
      isMarkupMode,
      isMarkupDrawing,
      markupTool,
      markupColor,
      markupLineWidth,
      markupDrawStart,
      zoomLevel,
    ],
  );

  // 마크업 초기화
  const clearMarkup = useCallback(() => {
    const canvas = markupCanvasRef.current;
    const ctx = markupCtxRef.current;
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      markupHistoryRef.current = [];
    }
  }, []);

  // 마크업 되돌리기 (Undo)
  const undoMarkup = useCallback(() => {
    const canvas = markupCanvasRef.current;
    const ctx = markupCtxRef.current;
    if (!canvas || !ctx || markupHistoryRef.current.length === 0) return;

    const previousState = markupHistoryRef.current.pop();
    if (previousState) {
      ctx.putImageData(previousState, 0, 0);
    }
  }, []);

  // baseSize 또는 zoomLevel 변경 시 Canvas 재초기화
  useEffect(() => {
    if (isMarkupMode) {
      initializeMarkupCanvas();
    }
  }, [baseSize, zoomLevel, isMarkupMode, initializeMarkupCanvas]);

  // Ctrl+Z 단축키 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && isMarkupMode) {
        e.preventDefault();
        undoMarkup();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMarkupMode, undoMarkup]);

  // 🚨 강력한 Wheel 이벤트 차단 (페이지 스크롤 방지)
  useEffect(() => {
    const handleWindowWheel = (e: Event) => {
      const wheelEvent = e as WheelEvent;
      const canvas = canvasRef.current;

      // 캔버스 위에 있으면 무조건 차단
      const isOnCanvas = canvas && canvas.contains(wheelEvent.target as Node);

      if (isOnCanvas) {
        // 이벤트 전파 완전 차단
        wheelEvent.preventDefault();
        wheelEvent.stopPropagation();
        wheelEvent.stopImmediatePropagation();
      }
    };

    // bubble phase에서 처리 (capture: false)하여 canvas 캡처가 먼저 실행되도록
    document.addEventListener("wheel", handleWindowWheel, {
      passive: false,
      capture: false,
    });

    return () => {
      document.removeEventListener("wheel", handleWindowWheel, {
        capture: false,
      });
    };
  }, []);

  // 캔버스에서의 wheel 이벤트 처리 - 페이지 스크롤 완벽 차단
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || (!baseImage && !isComparisonMode)) return;

    const handleWheelEvent = (e: WheelEvent) => {
      // ⚠️ 캔버스 위에서는 모든 wheel 이벤트를 차단
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      // 직접 줌 처리
      const delta = e.deltaY > 0 ? 0.85 : 1.15;
      setZoomLevel((prev) => {
        const newZoom = Math.max(0.1, Math.min(5, prev * delta));
        return newZoom;
      });
    };

    // capture phase에서 처리하여 가장 먼저 처리
    canvas.addEventListener("wheel", handleWheelEvent, {
      passive: false,
      capture: true,
    });

    return () => {
      canvas.removeEventListener("wheel", handleWheelEvent, { capture: true });
    };
  }, [baseImage, isComparisonMode]);

  return (
    <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-black flex flex-col h-full min-h-0 overflow-hidden gap-3">
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
              onClick={handleZoomOut}
              className="px-1 hover:font-bold"
              title="축소"
              type="button"
            >
              −
            </button>
            <span className="w-12 text-center font-semibold">
              {Math.round(zoomLevel * 100)}%
            </span>
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
          {/* 마크업 도구 토글 */}
          <button
            onClick={() => {
              setIsMarkupMode(!isMarkupMode);
              if (!isMarkupMode) initializeMarkupCanvas();
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition",
              isMarkupMode
                ? "bg-gray-700 text-white"
                : "bg-white text-black border-black",
            )}
            type="button"
            title={
              isMarkupMode ? "마크업 모드 해제" : "마크업 모드 (그리기, 주석)"
            }
          >
            {isMarkupMode ? "✏️ 마크업 중" : "✏️ 마크업"}
          </button>
        </div>
      </div>

      {/* 마크업 도구 옵션 */}
      {isMarkupMode && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-md border border-gray-200 flex-none">
          <div className="text-xs text-gray-600 font-medium mb-2 w-full">
            💡 마크업 팁: Shift + 드래그로 도면을 이동할 수 있습니다
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">도구:</span>
            {(["pen", "eraser", "line", "rect", "circle", "text"] as const).map(
              (tool) => (
                <button
                  key={tool}
                  onClick={() => setMarkupTool(tool)}
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
              ),
            )}
          </div>

          <span className="text-black/30">|</span>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">색상:</span>
            <input
              type="color"
              value={markupColor}
              onChange={(e) => setMarkupColor(e.target.value)}
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
              value={markupLineWidth}
              onChange={(e) => setMarkupLineWidth(parseInt(e.target.value))}
              className="w-24"
              title="선 두께 조정"
            />
            <span className="text-xs">{markupLineWidth}px</span>
          </div>

          <span className="text-black/30">|</span>

          <button
            onClick={undoMarkup}
            className="px-2 py-1 text-xs font-semibold bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            type="button"
            title="되돌리기 (Ctrl+Z)"
            disabled={markupHistoryRef.current.length === 0}
          >
            ↶ 취소
          </button>

          <button
            onClick={clearMarkup}
            className="px-2 py-1 text-xs font-semibold bg-red-500 text-white rounded hover:bg-red-600 transition"
            type="button"
            title="그림 초기화"
          >
            🗑️ 초기화
          </button>
        </div>
      )}
      {/* 비교 모드 정보 섹션 */}
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
      <div className="flex-1 flex items-center justify-center rounded-md border border-black bg-gray-50 overflow-hidden min-h-0">
        {!baseImage && !isComparisonMode ? (
          <p className="text-sm text-black">선택된 도면이 없습니다.</p>
        ) : isComparisonMode && comparisonDrawings.length > 0 ? (
          // 비교 모드: 오버레이 렌더링
          <div className="w-full h-full flex flex-col gap-2">
            {/* 레이어 컨트롤 패널 */}
            <div className="flex flex-wrap gap-2 p-2 bg-white border-b border-black">
              {comparisonDrawings.map((drawing, idx) => {
                const revEntry = data.revisions.find(
                  (r) => r.id === drawing.revisionId,
                );
                const revisionName = revEntry
                  ? `${revEntry.drawingName} - ${revEntry.revision}`
                  : `도면 ${idx + 1}`;
                const isVisible = getComparisonVisibility(drawing.revisionId);

                return (
                  <div
                    key={drawing.revisionId}
                    className="flex items-center gap-2 px-3 py-2 border border-black rounded text-xs bg-gray-50"
                  >
                    {/* 표시/숨김 토글 */}
                    <button
                      onClick={() =>
                        toggleComparisonVisibility(drawing.revisionId)
                      }
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

                    {/* 리비전 이름 */}
                    <span className="font-semibold whitespace-nowrap">
                      {revisionName}
                    </span>

                    {/* 투명도 슬라이더 */}
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600">투명도:</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={getComparisonOpacity(drawing.revisionId)}
                        onChange={(e) =>
                          setComparisonOpacity(
                            drawing.revisionId,
                            parseFloat(e.target.value),
                          )
                        }
                        className="w-20 h-1"
                        title="도면 투명도 조절"
                      />
                      <span className="w-8 text-right text-gray-600">
                        {Math.round(
                          getComparisonOpacity(drawing.revisionId) * 100,
                        )}
                        %
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 캔버스: 모든 도면 오버레이 */}
            <div
              ref={canvasRef}
              className="relative flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={stopPointerDrag}
              onPointerCancel={stopPointerDrag}
              onDragStart={(e) => e.preventDefault()}
              onDoubleClick={handleDoubleClick}
              onContextMenu={(e) => e.preventDefault()}
              style={{
                userSelect: isDragging ? "none" : "auto",
                touchAction: "none",
              }}
            >
              <div
                className="relative inline-block"
                style={{
                  maxWidth: baseSize.width,
                  maxHeight: baseSize.height,
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`,
                  transformOrigin: "top left",
                  transition: isDragging ? "none" : "transform 0.1s ease-out",
                }}
              >
                {/* 모든 비교 도면을 겹쳐서 표시 */}
                {comparisonDrawings.map((drawing, idx) => {
                  const isVisible = getComparisonVisibility(drawing.revisionId);
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
                        opacity: getComparisonOpacity(drawing.revisionId),
                      }}
                      width={baseSize.width}
                      height={baseSize.height}
                      unoptimized
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      onLoadingComplete={(img) => {
                        if (idx === 0) {
                          setBaseSize({
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
          <div
            ref={canvasRef}
            className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopPointerDrag}
            onPointerCancel={stopPointerDrag}
            onDragStart={(e) => e.preventDefault()}
            onDoubleClick={handleDoubleClick}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              userSelect: isDragging ? "none" : "auto",
              touchAction: "none",
            }}
          >
            <div
              className="relative inline-block w-full"
              style={{
                maxWidth: baseSize.width,
                maxHeight: baseSize.height,
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`,
                transformOrigin: "top left",
                transition: isDragging ? "none" : "transform 0.1s ease-out",
              }}
            >
              <Image
                src={`/drawings/${encodeURIComponent(baseImage || "")}`}
                alt="기준 도면"
                className="block h-auto w-full max-w-full border border-black"
                width={baseSize.width}
                height={baseSize.height}
                unoptimized
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
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
              {/* 마크업 Canvas 오버레이 */}
              {isMarkupMode && (
                <canvas
                  ref={markupCanvasRef}
                  className="absolute left-0 top-0 cursor-crosshair"
                  onMouseDown={handleMarkupMouseDown}
                  onMouseMove={handleMarkupMouseMove}
                  onMouseUp={handleMarkupMouseUp}
                  onMouseLeave={handleMarkupMouseUp}
                  title="마크업: 그리기 | Shift+마우스드래그: 도면 이동"
                  style={{
                    pointerEvents: isMarkupMode ? "auto" : "none",
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
      <div className="flex-none overflow-y-auto max-h-24">
        {visibleOverlays.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-black">
              활성 오버레이 ({visibleOverlays.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {visibleOverlays.map((overlay) => {
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
            <p className="text-xs text-gray-600">
              다중 도면을 색상으로 구분하여 표시합니다.
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-600">선택된 오버레이가 없습니다.</p>
        )}
      </div>
    </section>
  );
};

export default DrawingViewer;
