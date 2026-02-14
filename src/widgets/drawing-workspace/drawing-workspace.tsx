"use client";

import { useMemo, useState } from "react";
import { parseDrawingMetadata } from "@/entities/drawing/model";
import type { DrawingMetadata } from "@/entities/drawing/model";
import { DrawingExplorer } from "@/widgets/drawing-tree";
import { DrawingViewer } from "@/widgets/drawing-viewer";

// 탐색 트리와 도면 뷰어를 같은 상태로 연결하는 컨테이너
const DrawingWorkspace = ({ metadata }: { metadata: DrawingMetadata }) => {
  const parsed = useMemo(() => parseDrawingMetadata(metadata), [metadata]);
  const [selectedId, setSelectedId] = useState(parsed.tree.rootId);

  return (
    <div className="grid gap-4">
      <DrawingExplorer
        data={parsed}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <DrawingViewer data={parsed} selectedId={selectedId} />
    </div>
  );
};

export default DrawingWorkspace;
