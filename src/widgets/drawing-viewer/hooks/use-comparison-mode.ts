"use client";

import { useCallback, useState } from "react";
import type { ComparisonModeState } from "../types";

export const useComparisonMode = () => {
  const [state, setState] = useState<ComparisonModeState>({
    comparisonOpacities: {},
    comparisonVisibility: {},
  });

  const getOpacity = useCallback(
    (revisionId: string) => state.comparisonOpacities[revisionId] ?? 0.8,
    [state.comparisonOpacities],
  );

  const setOpacity = useCallback((revisionId: string, opacity: number) => {
    setState((prev) => ({
      ...prev,
      comparisonOpacities: {
        ...prev.comparisonOpacities,
        [revisionId]: Math.max(0, Math.min(1, opacity)),
      },
    }));
  }, []);

  const getVisibility = useCallback(
    (revisionId: string) => state.comparisonVisibility[revisionId] ?? true,
    [state.comparisonVisibility],
  );

  const toggleVisibility = useCallback((revisionId: string) => {
    setState((prev) => ({
      ...prev,
      comparisonVisibility: {
        ...prev.comparisonVisibility,
        [revisionId]: !(prev.comparisonVisibility[revisionId] ?? true),
      },
    }));
  }, []);

  // 비교 모드의 투명도/표시 상태 초기화 (drawing-viewer에서 호출)
  const initializeState = useCallback((revisionIds: string[]) => {
    setState({
      comparisonOpacities: Object.fromEntries(
        revisionIds.map((id) => [id, 0.8]),
      ),
      comparisonVisibility: Object.fromEntries(
        revisionIds.map((id) => [id, true]),
      ),
    });
  }, []);

  return {
    state,
    getOpacity,
    setOpacity,
    getVisibility,
    toggleVisibility,
    initializeState,
  };
};
