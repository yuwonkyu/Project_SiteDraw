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
  const [selectedRevisionId, setSelectedRevisionId] = useState<string>("");
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [comparisonRevisions, setComparisonRevisions] = useState<Set<string>>(
    new Set()
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
        setSelectedRevisionId("");
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

  const handleRevisionSelect = useCallback((revisionId: string) => {
    setSelectedRevisionId(revisionId);
  }, []);

  const handleToggleComparison = useCallback(() => {
    setIsComparisonMode((prev) => !prev);
    if (isComparisonMode) {
      setComparisonRevisions(new Set());
    }
  }, [isComparisonMode]);

  const handleAddToComparison = useCallback((revisionId: string) => {
    setComparisonRevisions((prev) => {
      const next = new Set(prev);
      if (next.has(revisionId)) {
        next.delete(revisionId);
      } else if (next.size < 2) {
        next.add(revisionId);
      }
      return next;
    });
  }, []);

  return (
    <div className="grid gap-4">
      <CurrentContext 
        data={parsed} 
        selectedIds={selectedIds} 
        visibleIds={visibleIds}
        selectedRevisionId={selectedRevisionId}
        isComparisonMode={isComparisonMode}
        comparisonRevisions={comparisonRevisions}
        onToggleVisibility={handleToggleVisibility}
        onRevisionSelect={handleRevisionSelect}
        onAddToComparison={handleAddToComparison}
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
          selectedRevisionId={selectedRevisionId}
          isComparisonMode={isComparisonMode}
          comparisonRevisions={comparisonRevisions}
          onSelect={handleSelect}
          onToggleComparison={handleToggleComparison}
          onAddToComparison={handleAddToComparison}
        />
      </div>
    </div>
  );
};

export default DrawingWorkspace;
