import { Breadcrumb, SectionTitle } from "@/shared/ui";
import type {
  NavigationNode,
  ParsedDrawingData,
  RevisionEntry,
} from "@/entities/drawing/model/parsed-types";

const kindLabel: Record<NavigationNode["kind"], string> = {
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

type CurrentContextProps = {
  data: ParsedDrawingData;
  selectedId: string;
};

const CurrentContext = ({ data, selectedId }: CurrentContextProps) => {
  const selectedNode = data.tree.nodes[selectedId];
  const relatedRevisions = selectedNode
    ? getRelatedRevisions(selectedNode, data.revisions)
    : [];

  return (
    <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-black">
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
            <div className="mt-3 h-48 space-y-2 overflow-y-auto pr-1">
              {relatedRevisions.length > 0 ? (
                relatedRevisions.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-md border border-black bg-white px-3 py-2 text-xs text-black"
                  >
                    <p className="font-semibold text-black">{entry.version}</p>
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
        <p className="mt-4 text-sm text-black">선택된 항목이 없습니다.</p>
      )}
    </section>
  );
};

export default CurrentContext;
