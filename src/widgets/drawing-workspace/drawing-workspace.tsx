"use client";

import { useMemo, useState } from "react";
import { parseDrawingMetadata } from "@/entities/drawing/model";
import type { DrawingMetadata } from "@/entities/drawing/model";
import { CurrentContext } from "@/widgets/drawing-context";
import { DrawingExplorer } from "@/widgets/drawing-tree";
import { DrawingViewer } from "@/widgets/drawing-viewer";

// 탐색 트리와 도면 뷰어를 같은 상태로 연결하는 컨테이너
const DrawingWorkspace = ({ metadata }: { metadata: DrawingMetadata }) => {
  const parsed = useMemo(() => parseDrawingMetadata(metadata), [metadata]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set([parsed.tree.rootId])
  );

  const handleSelect = (id: string, ctrlKey: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (ctrlKey) {
        // 다중 선택: Ctrl 누르고 클릭
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
      } else {
        // 단일 선택: 일반 클릭
        next.clear();
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="grid gap-4">
      <CurrentContext data={parsed} selectedIds={selectedIds} />
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <DrawingExplorer
          data={parsed}
          selectedIds={selectedIds}
          onSelect={handleSelect}
        />
        <DrawingViewer
          data={parsed}
          selectedIds={selectedIds}
          onSelect={handleSelect}
        />
      </div>
    </div>
  );
};

export default DrawingWorkspace;
