"use client";

import { useMemo, useState } from "react";
import { cn } from "@/shared/lib";
import { SectionTitle } from "@/shared/ui";
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
};

const DrawingExplorer = ({ data }: DrawingExplorerProps) => {
  const [selectedId, setSelectedId] = useState(data.tree.rootId);

  const selectedNode = data.tree.nodes[selectedId];
  const relatedRevisions = selectedNode
    ? getRelatedRevisions(selectedNode, data.revisions)
    : [];

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

    return (
      <div key={node.id} className="space-y-1">
        <button
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition",
            isSelected
              ? "bg-iron-900 text-white"
              : "text-concrete-700 hover:bg-concrete-100 dark:text-concrete-200 dark:hover:bg-concrete-800"
          )}
          style={{ marginLeft: depth * 12 }}
          type="button"
          onClick={() => setSelectedId(node.id)}
        >
          <span className="min-w-14 text-xs font-semibold uppercase text-concrete-400 dark:text-concrete-500">
            {kindLabel[node.kind]}
          </span>
          <span className="truncate">{node.name}</span>
        </button>
        {children.length > 0 && (
          <div className="space-y-1">
            {children.map((childId) => renderNode(childId, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="rounded-lg bg-surface p-5 shadow-sm ring-1 ring-concrete-300 dark:ring-concrete-700">
        <SectionTitle>탐색 구조</SectionTitle>
        <div className="mt-4 space-y-1">
          {data.tree.rootId ? renderNode(data.tree.rootId, 0) : null}
        </div>
      </div>
      <div className="rounded-lg bg-surface p-5 shadow-sm ring-1 ring-concrete-300 dark:ring-concrete-700">
        <SectionTitle>현재 컨텍스트</SectionTitle>
        {selectedNode ? (
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-concrete-400">
                경로
              </p>
              <p className="mt-2 text-sm font-semibold text-concrete-900 dark:text-concrete-100">
                {selectedNode.path.join(" > ")}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-concrete-200 bg-concrete-50 p-3 dark:border-concrete-700 dark:bg-concrete-900">
                <p className="text-xs font-semibold text-concrete-500">구분</p>
                <p className="mt-1 text-sm font-semibold text-concrete-900 dark:text-concrete-100">
                  {kindLabel[selectedNode.kind]}
                </p>
              </div>
              <div className="rounded-md border border-concrete-200 bg-concrete-50 p-3 dark:border-concrete-700 dark:bg-concrete-900">
                <p className="text-xs font-semibold text-concrete-500">리비전 수</p>
                <p className="mt-1 text-sm font-semibold text-concrete-900 dark:text-concrete-100">
                  {relatedRevisions.length}건
                </p>
              </div>
            </div>
            {selectedNode.kind === "revision" && (
              <div className="rounded-md border border-concrete-200 bg-concrete-50 p-3 dark:border-concrete-700 dark:bg-concrete-900">
                <p className="text-xs font-semibold text-concrete-500">변경 사항</p>
                <ul className="mt-2 space-y-1 text-xs text-concrete-700 dark:text-concrete-300">
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
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-concrete-400">
                리비전 목록
              </p>
              <div className="mt-3 space-y-2">
                {relatedRevisions.length > 0 ? (
                  relatedRevisions.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-md border border-concrete-200 bg-white px-3 py-2 text-xs text-concrete-700 dark:border-concrete-700 dark:bg-concrete-900 dark:text-concrete-300"
                    >
                      <p className="font-semibold text-concrete-900 dark:text-concrete-100">
                        {entry.version}
                      </p>
                      <p className="mt-1 text-[11px] text-concrete-500">
                        {entry.revision.date} · {entry.discipline}
                        {entry.regionId ? ` / Region ${entry.regionId}` : ""}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-concrete-500">
                    선택한 항목에 리비전이 없습니다.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-concrete-500">
            선택된 항목이 없습니다.
          </p>
        )}
      </div>
    </section>
  );
};

export default DrawingExplorer;
