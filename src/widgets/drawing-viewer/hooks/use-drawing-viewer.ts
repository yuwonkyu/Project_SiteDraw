"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ViewerState } from "../types";

export const useDrawingViewer = () => {
  const [viewerState, setViewerState] = useState<ViewerState>({
    baseSize: { width: 1600, height: 1000 },
    zoomLevel: 1,
    pan: { x: 0, y: 0 },
    isDragging: false,
    dragStart: { x: 0, y: 0 },
  });

  const activePointerIdRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const setBaseSize = useCallback((size: { width: number; height: number }) => {
    setViewerState((prev) => ({ ...prev, baseSize: size }));
  }, []);

  const setZoomLevel = useCallback((zoom: number) => {
    setViewerState((prev) => ({ ...prev, zoomLevel: zoom }));
  }, []);

  const setPan = useCallback((pan: { x: number; y: number }) => {
    setViewerState((prev) => ({ ...prev, pan }));
  }, []);

  const setIsDragging = useCallback((isDragging: boolean) => {
    setViewerState((prev) => ({ ...prev, isDragging }));
  }, []);

  const setDragStart = useCallback((dragStart: { x: number; y: number }) => {
    setViewerState((prev) => ({ ...prev, dragStart }));
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, isMarkupMode: boolean) => {
      if (isMarkupMode && e.button === 0 && !e.shiftKey) return;
      if (e.button !== 0) return;

      e.preventDefault();
      activePointerIdRef.current = e.pointerId;
      e.currentTarget.setPointerCapture(e.pointerId);

      setIsDragging(true);
      setDragStart({
        x: e.clientX - viewerState.pan.x,
        y: e.clientY - viewerState.pan.y,
      });
    },
    [viewerState.pan, setIsDragging, setDragStart],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!viewerState.isDragging || activePointerIdRef.current !== e.pointerId)
        return;
      e.preventDefault();
      setPan({
        x: e.clientX - viewerState.dragStart.x,
        y: e.clientY - viewerState.dragStart.y,
      });
    },
    [viewerState.isDragging, viewerState.dragStart, setPan],
  );

  const stopPointerDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (activePointerIdRef.current === e.pointerId) {
        e.currentTarget.releasePointerCapture(e.pointerId);
        activePointerIdRef.current = null;
      }
      if (viewerState.isDragging) {
        e.preventDefault();
      }
      setIsDragging(false);
    },
    [viewerState.isDragging, setIsDragging],
  );

  const resetZoomAndPan = useCallback(() => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  }, [setZoomLevel, setPan]);

  const handleZoomIn = useCallback(() => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = rect.width / 2 / viewerState.zoomLevel;
    const mouseY = rect.height / 2 / viewerState.zoomLevel;

    const newZoom = Math.min(5, viewerState.zoomLevel * 1.2);
    const zoomRatio = newZoom / viewerState.zoomLevel;

    setPan({
      x: viewerState.pan.x - mouseX * (zoomRatio - 1),
      y: viewerState.pan.y - mouseY * (zoomRatio - 1),
    });
    setZoomLevel(newZoom);
  }, [viewerState.zoomLevel, viewerState.pan, setPan, setZoomLevel]);

  const handleZoomOut = useCallback(() => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = rect.width / 2 / viewerState.zoomLevel;
    const mouseY = rect.height / 2 / viewerState.zoomLevel;

    const newZoom = Math.max(0.1, viewerState.zoomLevel / 1.2);
    const zoomRatio = newZoom / viewerState.zoomLevel;

    setPan({
      x: viewerState.pan.x - mouseX * (zoomRatio - 1),
      y: viewerState.pan.y - mouseY * (zoomRatio - 1),
    });
    setZoomLevel(newZoom);
  }, [viewerState.zoomLevel, viewerState.pan, setPan, setZoomLevel]);

  const handleDoubleClick = useCallback(() => {
    if (!canvasRef.current) return;
    const container = canvasRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const zoomX = containerWidth / viewerState.baseSize.width;
    const zoomY = containerHeight / viewerState.baseSize.height;
    const fitZoom = Math.min(zoomX, zoomY, 1);

    setZoomLevel(fitZoom);
    setPan({ x: 0, y: 0 });
  }, [viewerState.baseSize, setZoomLevel, setPan]);

  // Wheel 이벤트 처리
  useEffect(() => {
    const handleWindowWheel = (e: Event) => {
      const wheelEvent = e as WheelEvent;
      const canvas = canvasRef.current;
      const isOnCanvas = canvas && canvas.contains(wheelEvent.target as Node);

      if (isOnCanvas) {
        wheelEvent.preventDefault();
        wheelEvent.stopPropagation();
        wheelEvent.stopImmediatePropagation();
      }
    };

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const delta = e.deltaY > 0 ? 0.85 : 1.15;
      setViewerState((prev) => ({
        ...prev,
        zoomLevel: Math.max(0.1, Math.min(5, prev.zoomLevel * delta)),
      }));
    };

    canvas.addEventListener("wheel", handleWheelEvent, {
      passive: false,
      capture: true,
    });

    return () => {
      canvas.removeEventListener("wheel", handleWheelEvent, { capture: true });
    };
  }, []);

  return {
    viewerState,
    canvasRef,
    activePointerIdRef,
    setBaseSize,
    setZoomLevel,
    setPan,
    setIsDragging,
    setDragStart,
    handlePointerDown,
    handlePointerMove,
    stopPointerDrag,
    resetZoomAndPan,
    handleZoomIn,
    handleZoomOut,
    handleDoubleClick,
  };
};
