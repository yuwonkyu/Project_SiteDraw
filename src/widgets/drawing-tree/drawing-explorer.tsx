"use client";

import { useLayoutEffect, useMemo, useState } from "react";
import { cn } from "@/shared/lib";
import { SectionTitle } from "@/shared/ui";
import type {
  NavigationNodeKind,
  ParsedDrawingData,
} from "@/entities/drawing/model/parsed-types";

const kindOrder: Record<NavigationNodeKind, number> = {
  drawing: 0,
  discipline: 1,
  region: 2,
  revision: 3,
};

const kindLabel: Record<NavigationNodeKind, string> = {
  drawing: "도면",
  discipline: "공종",
  region: "영역",
  revision: "리비전",
};

type DrawingExplorerProps = {
  data: ParsedDrawingData;
  selectedIds: Set<string>;
  onSelect: (id: string, ctrlKey: boolean) => void;
};

const DrawingExplorer = ({
  data,
  selectedIds,
  onSelect,
}: DrawingExplorerProps) => {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    [data.tree.rootId]: true,
  });

  useLayoutEffect(() => {
    if (selectedIds.size === 0) {
      return;
    }

    const nextExpanded: Record<string, boolean> = {};

    // 모든 선택된 id에 대해 부모 경로를 확장
    selectedIds.forEach((selectedId) => {
      let current = data.tree.nodes[selectedId];

      while (current?.parentId) {
        nextExpanded[current.parentId] = true;
        current = data.tree.nodes[current.parentId];
      }

      if (data.tree.nodes[selectedId]?.children?.length) {
        nextExpanded[selectedId] = true;
      }
    });

    // 필요한 변경이 있을 때만 업데이트
    setExpandedIds((prev) => {
      const hasChanges = Object.keys(nextExpanded).some(
        (key) => prev[key] !== nextExpanded[key],
      );
      return hasChanges ? { ...prev, ...nextExpanded } : prev;
    });
  }, [data.tree.nodes, selectedIds]);

  const sortedChildren = useMemo(() => {
    const cache: Record<string, string[]> = {};

    Object.values(data.tree.nodes).forEach((node) => {
      cache[node.id] = [...node.children].sort((aId, bId) => {
        const aNode = data.tree.nodes[aId];
        const bNode = data.tree.nodes[bId];
        if (!aNode || !bNode) {
          return 0;
        }
        const kindGap = kindOrder[aNode.kind] - kindOrder[bNode.kind];
        if (kindGap !== 0) {
          return kindGap;
        }
        return aNode.name.localeCompare(bNode.name, "ko");
      });
    });

    return cache;
  }, [data.tree.nodes]);

  const renderNode = (nodeId: string, depth: number) => {
    const node = data.tree.nodes[nodeId];
    if (!node) {
      return null;
    }

    const isSelected = selectedIds.has(node.id);
    const children = sortedChildren[node.id] ?? [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds[node.id] ?? false;

    const handleSelect = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onSelect(node.id, e.ctrlKey || e.metaKey);
    };

    const handleToggleExpand = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (!hasChildren) {
        return;
      }
      setExpandedIds((prev) => ({
        ...prev,
        [node.id]: !isExpanded,
      }));
    };

    return (
      <div key={node.id} className="space-y-1">
        <div
          className={cn(
            "rounded-md",
            depth > 0 ? "border-l border-black/20 pl-3" : "",
          )}
          style={{ marginLeft: depth > 0 ? depth * 10 : 0 }}
        >
          <div className="flex w-full items-center gap-1">
            <button
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded border text-[10px] font-bold hover:bg-gray-200 transition shrink-0",
                "border-black",
                isSelected ? "bg-white text-black" : "bg-white",
                hasChildren ? "cursor-pointer" : "opacity-40 cursor-default",
              )}
              type="button"
              onClick={handleToggleExpand}
              disabled={!hasChildren}
              title={
                hasChildren ? (isExpanded ? "접기" : "펼치기") : "자식 없음"
              }
            >
              {hasChildren ? (isExpanded ? "-" : "+") : ""}
            </button>
            <button
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-md px-2 py-2 text-left text-sm transition",
                isSelected
                  ? "bg-gray-700 text-white"
                  : "text-black hover:bg-gray-100",
              )}
              type="button"
              onClick={handleSelect}
              title={`${node.name} (Ctrl+Click: multi-select)`}
            >
              <span
                className={cn(
                  "min-w-14 shrink-0 rounded-full border border-black px-2 py-0.5 text-[10px] font-semibold uppercase",
                  isSelected ? "border-white text-white" : "text-black",
                )}
              >
                {kindLabel[node.kind]}
              </span>
              <span className="truncate" title={node.name}>
                {node.name}
              </span>
            </button>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {children.map((childId) => renderNode(childId, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-black">
      <SectionTitle>탐색 구조</SectionTitle>
      <div className="mt-4 space-y-1">
        {data.tree.rootId ? renderNode(data.tree.rootId, 0) : null}
      </div>
    </div>
  );
};

export default DrawingExplorer;
