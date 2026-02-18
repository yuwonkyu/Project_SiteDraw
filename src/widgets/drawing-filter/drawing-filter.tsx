"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/shared/lib";
import { SectionTitle } from "@/shared/ui";
import type { ParsedDrawingData } from "@/entities/drawing/model";

const kindLabel = {
  drawing: "도면",
  discipline: "공종",
  region: "영역",
  revision: "리비전",
} as const;

const kindOrder = {
  drawing: 0,
  discipline: 1,
  region: 2,
  revision: 3,
} as const;

type DrawingFilterProps = {
  data: ParsedDrawingData;
  onSelect: (id: string, add: boolean) => void;
};

export const DrawingFilter = ({ data, onSelect }: DrawingFilterProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDiscipline, setFilterDiscipline] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);

  // 모든 고유한 공종 추출
  const disciplines = useMemo(() => {
    const uniqueDisciplines = new Set<string>();
    Object.values(data.tree.nodes).forEach((node) => {
      if (node.kind === "discipline") {
        uniqueDisciplines.add(node.discipline);
      }
    });
    return Array.from(uniqueDisciplines).sort();
  }, [data]);

  // 검색 + 필터 적용
  const filteredNodeIds = useMemo(() => {
    const results = new Set<string>();
    const searchLower = searchTerm.toLowerCase();

    Object.entries(data.tree.nodes).forEach(([id, node]) => {
      let matches = true;

      const nodeDiscipline =
        node.kind === "discipline" ||
        node.kind === "region" ||
        node.kind === "revision"
          ? node.discipline
          : null;

      // 도면명/공종명 검색
      if (searchTerm) {
        const nodeNameLower = node.name?.toLowerCase() || "";
        const disciplineNameLower = nodeDiscipline?.toLowerCase() || "";
        const pathLower = node.path?.join(" ").toLowerCase() || "";
        matches =
          nodeNameLower.includes(searchLower) ||
          disciplineNameLower.includes(searchLower) ||
          pathLower.includes(searchLower);
      }

      // 공종 필터
      if (filterDiscipline) {
        matches = matches && nodeDiscipline === filterDiscipline;
      }

      if (matches && node.name) {
        results.add(id);
      }
    });

    return results;
  }, [searchTerm, filterDiscipline, data]);

  const sortedResultIds = useMemo(() => {
    return Array.from(filteredNodeIds).sort((aId, bId) => {
      const aNode = data.tree.nodes[aId];
      const bNode = data.tree.nodes[bId];
      if (!aNode || !bNode) return 0;
      const kindGap = kindOrder[aNode.kind] - kindOrder[bNode.kind];
      if (kindGap !== 0) return kindGap;
      return aNode.name.localeCompare(bNode.name, "ko");
    });
  }, [filteredNodeIds, data]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handleDisciplineFilter = useCallback((discipline: string | null) => {
    setFilterDiscipline(discipline);
  }, []);

  const resultCount = useMemo(() => {
    if (!searchTerm && !filterDiscipline)
      return Object.keys(data.tree.nodes).length;
    return filteredNodeIds.size;
  }, [searchTerm, filterDiscipline, data, filteredNodeIds]);

  useEffect(() => {
    setVisibleCount(10);
  }, [searchTerm, filterDiscipline]);

  return (
    <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-black">
      <SectionTitle>검색 & 필터</SectionTitle>

      {/* 검색 입력 */}
      <div className="mt-3 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="도면명, 공종명으로 검색..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 px-3 py-2 border border-black rounded text-sm"
          />
          <span className="text-xs font-semibold text-black">
            결과: {resultCount}개
          </span>
        </div>

        {/* 공종 필터 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-black">공종:</span>
          <button
            onClick={() => handleDisciplineFilter(null)}
            className={cn(
              "px-2 py-1 text-xs rounded border transition",
              !filterDiscipline
                ? "bg-gray-700 text-white border-gray-700"
                : "bg-white text-black border-gray-300 hover:border-gray-700",
            )}
            type="button"
          >
            전체
          </button>
          {disciplines.map((discipline) => (
            <button
              key={discipline}
              onClick={() => handleDisciplineFilter(discipline)}
              className={cn(
                "px-2 py-1 text-xs rounded border transition",
                filterDiscipline === discipline
                  ? "bg-gray-700 text-white border-gray-700"
                  : "bg-white text-black border-gray-300 hover:border-gray-700",
              )}
              type="button"
              title={`${discipline}만 보기`}
            >
              {discipline}
            </button>
          ))}
        </div>

        {/* 필터된 결과 표시 */}
        {(searchTerm || filterDiscipline) && filteredNodeIds.size > 0 && (
          <div className="mt-2 text-xs text-black">
            <div className="flex items-center justify-between">
              <p className="font-semibold">검색된 항목:</p>
              <span className="text-[11px] text-black/60">
                클릭: 선택 · +: 추가
              </span>
            </div>
            <div className="mt-2 max-h-40 space-y-1 overflow-y-auto pr-1">
              {sortedResultIds.slice(0, visibleCount).map((id) => {
                const node = data.tree.nodes[id];
                if (!node) return null;
                return (
                  <div
                    key={id}
                    className="flex items-center gap-2 rounded border border-gray-200 bg-gray-50 px-2 py-1"
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(id, false)}
                      className="flex min-w-0 flex-1 flex-col text-left"
                      title={node.name}
                    >
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 rounded-full border border-black px-2 py-0.5 text-[10px] font-semibold uppercase">
                          {kindLabel[node.kind]}
                        </span>
                        <span className="truncate text-xs font-semibold">
                          {node.name}
                        </span>
                      </div>
                      <span
                        className="mt-0.5 truncate text-[11px] text-black/60"
                        title={node.path.join(" > ")}
                      >
                        {node.path.join(" > ")}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelect(id, true)}
                      className="shrink-0 rounded border border-black px-2 py-1 text-[10px] font-semibold hover:bg-white"
                      title="현재 선택에 추가"
                    >
                      +추가
                    </button>
                  </div>
                );
              })}
            </div>
            {sortedResultIds.length > visibleCount && (
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCount((prev) =>
                      Math.min(sortedResultIds.length, prev + 20),
                    )
                  }
                  className="rounded border border-black px-2 py-1 text-[10px] font-semibold hover:bg-gray-100"
                >
                  더보기 (+20)
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleCount(sortedResultIds.length)}
                  className="rounded border border-black px-2 py-1 text-[10px] font-semibold hover:bg-gray-100"
                >
                  전체보기
                </button>
              </div>
            )}
          </div>
        )}

        {(searchTerm || filterDiscipline) && filteredNodeIds.size === 0 && (
          <p className="text-xs text-red-600">검색 결과가 없습니다.</p>
        )}
      </div>

      {/* 빠른 필터 */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <span className="text-xs font-semibold text-black">빠른 필터:</span>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setSearchTerm("");
              handleDisciplineFilter(null);
            }}
            className="px-2 py-1 text-xs bg-gray-200 text-black rounded hover:bg-gray-300 transition"
            type="button"
          >
            초기화
          </button>
          <button
            onClick={() => {
              setSearchTerm("평면도");
              handleDisciplineFilter(null);
            }}
            className="px-2 py-1 text-xs bg-gray-200 text-black rounded hover:bg-gray-300 transition"
            type="button"
          >
            평면도
          </button>
          <button
            onClick={() => {
              setSearchTerm("구조");
              handleDisciplineFilter(null);
            }}
            className="px-2 py-1 text-xs bg-gray-200 text-black rounded hover:bg-gray-300 transition"
            type="button"
          >
            구조
          </button>
          <button
            onClick={() => {
              setSearchTerm("설비");
              handleDisciplineFilter(null);
            }}
            className="px-2 py-1 text-xs bg-gray-200 text-black rounded hover:bg-gray-300 transition"
            type="button"
          >
            설비
          </button>
        </div>
      </div>
    </section>
  );
};
