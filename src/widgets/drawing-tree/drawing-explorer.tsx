"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/shared/lib";
import { Breadcrumb, SectionTitle } from "@/shared/ui";
import type {
  NavigationNode,
  NavigationNodeKind,
  ParsedDrawingData,
  RevisionEntry,
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

const getRelatedRevisions = (
  node: NavigationNode,
  revisions: RevisionEntry[]
) => {
  if (node.kind === "drawing") {
    return revisions.filter((entry) => entry.drawingId === node.drawingId);
  }
  if (node.kind === "discipline") {
    return revisions.filter(
      (entry) =>
        entry.drawingId === node.drawingId &&
        entry.discipline === node.discipline
    );
  }
  if (node.kind === "region") {
    return revisions.filter(
      (entry) =>
        entry.drawingId === node.drawingId &&
        entry.discipline === node.discipline &&
        entry.regionId === node.regionId
    );
  }
  if (node.kind === "revision") {
    return revisions.filter((entry) => entry.id === node.id);
  }
  return [];
};

type DrawingExplorerProps = {
  data: ParsedDrawingData;
  selectedId: string;
  onSelect: (id: string) => void;
};

const DrawingExplorer = ({ data, selectedId, onSelect }: DrawingExplorerProps) => {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    [data.tree.rootId]: true,
  });

  const selectedNode = data.tree.nodes[selectedId];
  const relatedRevisions = selectedNode
    ? getRelatedRevisions(selectedNode, data.revisions)
    : [];

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    const nextExpanded: Record<string, boolean> = {};
    let current = data.tree.nodes[selectedId];

    while (current?.parentId) {
      nextExpanded[current.parentId] = true;
      current = data.tree.nodes[current.parentId];
    }

    if (data.tree.nodes[selectedId]?.children?.length) {
      nextExpanded[selectedId] = true;
    }

    setExpandedIds((prev) => ({
      ...prev,
      ...nextExpanded,
    }));
  }, [data.tree.nodes, selectedId]);

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

    const isSelected = node.id === selectedId;
    const children = sortedChildren[node.id] ?? [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds[node.id] ?? false;

    const handleSelect = () => {
      onSelect(node.id);
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
            depth > 0 ? "border-l border-black/20 pl-3" : ""
          )}
          style={{ marginLeft: depth > 0 ? depth * 10 : 0 }}
        >
          <button
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition",
              isSelected
                ? "bg-gray-700 text-white"
                : "text-black hover:bg-gray-100"
            )}
            type="button"
            onClick={handleSelect}
          >
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded border text-[10px]",
                "border-black",
                isSelected ? "bg-white text-black" : "bg-white",
                hasChildren ? "" : "opacity-40"
              )}
            >
              {hasChildren ? (isExpanded ? "-" : "+") : ""}
            </span>
            <span
              className={cn(
                "min-w-14 rounded-full border border-black px-2 py-0.5 text-[10px] font-semibold uppercase",
                isSelected ? "border-white text-white" : "text-black"
              )}
            >
              {kindLabel[node.kind]}
            </span>
            <span className="truncate">{node.name}</span>
          </button>
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
    <section className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-black">
        <SectionTitle>탐색 구조</SectionTitle>
        <div className="mt-4 space-y-1">
          {data.tree.rootId ? renderNode(data.tree.rootId, 0) : null}
        </div>
      </div>
      <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-black">
        <SectionTitle>현재 컨텍스트</SectionTitle>
        {selectedNode ? (
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black">
                경로
              </p>
              <div className="mt-2">
                <Breadcrumb items={selectedNode.path} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-black bg-white p-3">
                <p className="text-xs font-semibold text-black">구분</p>
                <p className="mt-1 text-sm font-semibold text-black">
                  {kindLabel[selectedNode.kind]}
                </p>
              </div>
              <div className="rounded-md border border-black bg-white p-3">
                <p className="text-xs font-semibold text-black">리비전 수</p>
                <p className="mt-1 text-sm font-semibold text-black">
                  {relatedRevisions.length}건
                </p>
              </div>
            </div>
            {selectedNode.kind === "revision" && (
              <div className="rounded-md border border-black bg-white p-3">
                <p className="text-xs font-semibold text-black">변경 사항</p>
                <ul className="mt-2 space-y-1 text-xs text-black">
                  {selectedNode.revision.changes.length > 0 ? (
                    selectedNode.revision.changes.map((change) => (
                      <li key={change}>- {change}</li>
                    ))
                  ) : (
                    <li>- 초기 설계</li>
                  )}
                </ul>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black">
                리비전 목록
              </p>
              <div className="mt-3 space-y-2">
                {relatedRevisions.length > 0 ? (
                  relatedRevisions.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-md border border-black bg-white px-3 py-2 text-xs text-black"
                    >
                      <p className="font-semibold text-black">
                        {entry.version}
                      </p>
                      <p className="mt-1 text-[11px] text-black">
                        {entry.revision.date} · {entry.discipline}
                        {entry.regionId ? ` / Region ${entry.regionId}` : ""}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-black">
                    선택한 항목에 리비전이 없습니다.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-black">
            선택된 항목이 없습니다.
          </p>
        )}
      </div>
    </section>
  );
};

export default DrawingExplorer;
