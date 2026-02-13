import { Header, MainArea, Sidebar } from "@/widgets/layout";
import { mockMetadata } from "@/shared/mock";
import { SectionTitle } from "@/shared/ui";
import { parseDrawingMetadata } from "@/entities/drawing/model";
import { DrawingExplorer } from "@/widgets/drawing-tree";

const HomePage = () => {
  const drawings = Object.values(mockMetadata.drawings);
  const disciplines = mockMetadata.disciplines.map(
    (discipline) => discipline.name
  );
  const parsed = parseDrawingMetadata(mockMetadata);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Header />
      <div className="grid grid-cols-1 gap-6 px-4 pb-8 pt-5 md:grid-cols-[240px_1fr] md:gap-8 md:px-8">
        <Sidebar />
        <MainArea>
          <DrawingExplorer data={parsed} />
          <section className="rounded-lg bg-surface p-6 shadow-sm ring-1 ring-concrete-300 dark:ring-concrete-700">
            <div className="flex items-center justify-between">
              <div>
                <SectionTitle>활성 Drawing 세트</SectionTitle>
                <h1 className="mt-3 text-2xl font-semibold text-concrete-900 dark:text-concrete-100">
                  {mockMetadata.project.name}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-concrete-600 dark:text-concrete-400">
                  단위: {mockMetadata.project.unit} - Discipline: {" "}
                  {disciplines.join(", ")}
                </p>
              </div>
              <button
                className="hidden rounded-lg bg-iron-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-iron-900 md:block"
                type="button"
              >
                새 업로드
              </button>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="rounded-lg bg-surface p-6 shadow-sm ring-1 ring-concrete-300 dark:ring-concrete-700">
              <SectionTitle>Drawing 목록</SectionTitle>
              <ul className="mt-4 space-y-3">
                {drawings.map((drawing) => (
                  <li
                    key={drawing.id}
                    className="flex flex-col gap-3 rounded-lg border border-concrete-300 bg-concrete-50 p-4 transition hover:border-iron-400 dark:border-concrete-700 dark:bg-concrete-900 dark:hover:border-iron-600 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-concrete-900 dark:text-concrete-100">
                        {drawing.name}
                      </p>
                      <p className="mt-1 text-xs text-concrete-600 dark:text-concrete-400">
                        {drawing.id} - 상위 {drawing.parent ?? "없음"}
                      </p>
                    </div>
                    <span className="w-fit rounded-md bg-concrete-200 px-3 py-1 text-xs font-semibold text-concrete-700 dark:bg-concrete-700 dark:text-concrete-300">
                      {drawing.image}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg bg-iron-900 p-6 text-white shadow-sm dark:bg-iron-950">
              <SectionTitle>오늘</SectionTitle>
              <div className="mt-4 space-y-4">
                <div className="rounded-lg bg-safety-500/90 p-4 text-concrete-900">
                  <p className="text-sm font-bold">대기 중인 Revision 3건</p>
                  <p className="mt-1 text-xs font-medium">
                    MEP Drawing Review 대기열이 증가 중입니다.
                  </p>
                </div>
                <div className="rounded-lg border border-iron-700 bg-iron-800 p-4">
                  <p className="text-sm font-semibold">승인 전송 2건</p>
                  <p className="mt-1 text-xs text-iron-300">
                    최신 구조 업데이트가 공유되었습니다.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </MainArea>
      </div>
    </div>
  );
};

export default HomePage;
