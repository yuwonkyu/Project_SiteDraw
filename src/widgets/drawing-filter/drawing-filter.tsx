"use client";

import { useCallback, useMemo, useState } from "react";
import { cn } from "@/shared/lib";
import { SectionTitle } from "@/shared/ui";
import type { ParsedDrawingData } from "@/entities/drawing/model";

type DrawingFilterProps = {
  data: ParsedDrawingData;
  selectedIds: Set<string>;
  visibleIds: Set<string>;
  onSearch: (filteredNodeIds: Set<string>) => void;
  onToggleDisciplineVisibility: (disciplineId: string) => void;
};

export const DrawingFilter = ({
  data,
  selectedIds,
  visibleIds,
  onSearch,
  onToggleDisciplineVisibility,
}: DrawingFilterProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDiscipline, setFilterDiscipline] = useState<string | null>(null);

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

      // 도면명/공종명 검색
      if (searchTerm) {
        const nodeNameLower = node.name?.toLowerCase() || "";
        const disciplineNameLower =
          node.kind === "discipline" ? node.discipline.toLowerCase() : "";
        matches =
          nodeNameLower.includes(searchLower) ||
          disciplineNameLower.includes(searchLower);
      }

      // 공종 필터
      if (filterDiscipline && node.kind === "discipline") {
        matches = matches && node.discipline === filterDiscipline;
      }

      if (matches && node.name) {
        results.add(id);
      }
    });

    return results;
  }, [searchTerm, filterDiscipline, data]);

  const handleSearch = useCallback(
    (term: string) => {
      setSearchTerm(term);
      if (term || filterDiscipline) {
        onSearch(filteredNodeIds);
      } else {
        // 검색어 없으면 전체 노드 선택
        onSearch(new Set(Object.keys(data.tree.nodes)));
      }
    },
    [filterDiscipline, filteredNodeIds, onSearch, data]
  );

  const handleDisciplineFilter = useCallback(
    (discipline: string | null) => {
      setFilterDiscipline(discipline);
    },
    []
  );

  const resultCount = useMemo(() => {
    if (!searchTerm && !filterDiscipline) return Object.keys(data.tree.nodes).length;
    return filteredNodeIds.size;
  }, [searchTerm, filterDiscipline, data, filteredNodeIds]);

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
                : "bg-white text-black border-gray-300 hover:border-gray-700"
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
                  : "bg-white text-black border-gray-300 hover:border-gray-700"
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
            <p className="font-semibold mb-1">검색된 항목:</p>
            <div className="flex flex-wrap gap-1">
              {Array.from(filteredNodeIds)
                .slice(0, 10)
                .map((id) => {
                  const node = data.tree.nodes[id];
                  return (
                    <span
                      key={id}
                      className="bg-gray-100 border border-gray-300 rounded px-2 py-0.5 text-xs"
                    >
                      {node.name || id}
                    </span>
                  );
                })}
              {filteredNodeIds.size > 10 && (
                <span className="text-gray-600">
                  +{filteredNodeIds.size - 10}개
                </span>
              )}
            </div>
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
