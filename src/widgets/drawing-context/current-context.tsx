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
  selectedIds: Set<string>;
  visibleIds: Set<string>;
  onToggleVisibility: (id: string) => void;
};

const CurrentContext = ({ data, selectedIds, visibleIds, onToggleVisibility }: CurrentContextProps) => {
  const selectedNodes = Array.from(selectedIds)
    .map((id) => data.tree.nodes[id])
    .filter((node) => !!node);

  const primaryNode = selectedNodes[0];
  const relatedRevisions = primaryNode
    ? getRelatedRevisions(primaryNode, data.revisions)
    : [];

  return (
    <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-black">
      <SectionTitle>현재 컨텍스트</SectionTitle>
      {selectedNodes.length > 0 ? (
        <div className="mt-4 space-y-4">
          {/* 주 선택 항목 */}
          {primaryNode && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black">
                선택 경로
              </p>
              <div className="mt-2">
                <Breadcrumb items={primaryNode.path} />
              </div>
            </div>
          )}

          {/* 선택 항목 카드 (단일/다중) */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black">
              활성 레이어 ({selectedNodes.length})
            </p>
            <div className="space-y-2">
              {selectedNodes.map((node) => {
                const isVisible = visibleIds.has(node.id);
                return (
                  <div
                    key={node.id}
                    className={`rounded-md border px-3 py-2 transition ${
                      isVisible
                        ? "border-black bg-gray-50"
                        : "border-black/30 bg-gray-200/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-black">
                          {kindLabel[node.kind]} · {node.name}
                        </p>
                        <p className="mt-1 text-[11px] text-black/70">
                          {node.path.join(" > ")}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleVisibility(node.id)}
                        className={`mt-0.5 flex-shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold transition ${
                          isVisible
                            ? "border-black bg-white text-black hover:bg-gray-50"
                            : "border-black/30 bg-gray-100 text-black/50 hover:bg-gray-200"
                        }`}
                        title={isVisible ? "레이어 숨기기" : "레이어 표시"}
                      >
                        {isVisible ? "표시" : "숨김"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 주 선택 항목 상세 정보 */}
          {primaryNode && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-black bg-white p-3">
                  <p className="text-xs font-semibold text-black">구분</p>
                  <p className="mt-1 text-sm font-semibold text-black">
                    {kindLabel[primaryNode.kind]}
                  </p>
                </div>
                <div className="rounded-md border border-black bg-white p-3">
                  <p className="text-xs font-semibold text-black">리비전 수</p>
                  <p className="mt-1 text-sm font-semibold text-black">
                    {relatedRevisions.length}건
                  </p>
                </div>
              </div>
              {primaryNode.kind === "revision" && (
                <div className="rounded-md border border-black bg-white p-3">
                  <p className="text-xs font-semibold text-black">변경 사항</p>
                  <ul className="mt-2 space-y-1 text-xs text-black">
                    {primaryNode.revision.changes.length > 0 ? (
                      primaryNode.revision.changes.map((change) => (
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
            </>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-black">선택된 항목이 없습니다.</p>
      )}
    </section>
  );
};

export default CurrentContext;
