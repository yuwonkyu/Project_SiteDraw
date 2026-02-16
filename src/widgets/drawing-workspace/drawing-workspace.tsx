"use client";

import { useCallback, useMemo, useState } from "react";
import { parseDrawingMetadata } from "@/entities/drawing/model";
import type { DrawingMetadata } from "@/entities/drawing/model";
import { CurrentContext } from "@/widgets/drawing-context";
import { DrawingExplorer } from "@/widgets/drawing-tree";
import { DrawingViewer } from "@/widgets/drawing-viewer";

type DrawingWorkspaceProps = {
  metadata: DrawingMetadata;
};

const DrawingWorkspace = ({ metadata }: DrawingWorkspaceProps) => {
  const parsed = useMemo(() => parseDrawingMetadata(metadata), [metadata]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set([parsed.tree.rootId])
  );
  const [visibleIds, setVisibleIds] = useState<Set<string>>(
    new Set([parsed.tree.rootId])
  );

  const handleSelect = useCallback((id: string, ctrlKey: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (ctrlKey) {
        if (next.has(id)) {
          next.delete(id);
          setVisibleIds((visible) => {
            const updated = new Set(visible);
            updated.delete(id);
            return updated;
          });
        } else {
          next.add(id);
          setVisibleIds((visible) => new Set(visible).add(id));
        }
      } else {
        next.clear();
        next.add(id);
        setVisibleIds(new Set([id]));
      }
      return next;
    });
  }, []);

  const handleToggleVisibility = useCallback((id: string) => {
    setVisibleIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="grid gap-4">
      <CurrentContext 
        data={parsed} 
        selectedIds={selectedIds} 
        visibleIds={visibleIds}
        onToggleVisibility={handleToggleVisibility}
      />
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <DrawingExplorer
          data={parsed}
          selectedIds={selectedIds}
          onSelect={handleSelect}
        />
        <DrawingViewer
          data={parsed}
          selectedIds={selectedIds}
          visibleIds={visibleIds}
          onSelect={handleSelect}
        />
      </div>
    </div>
  );
};

export default DrawingWorkspace;
