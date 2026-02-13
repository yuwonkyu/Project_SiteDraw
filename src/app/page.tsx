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
    <div className="min-h-dvh bg-white text-black">
      <Header />
      <div className="grid grid-cols-1 gap-6 px-4 pb-8 pt-5 md:grid-cols-[240px_1fr] md:gap-8 md:px-8">
        <Sidebar />
        <MainArea>
          <DrawingExplorer data={parsed} />
          <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-black">
            <div className="flex items-center justify-between">
              <div>
                <SectionTitle>활성 Drawing 세트</SectionTitle>
                <h1 className="mt-3 text-2xl font-semibold text-black">
                  {mockMetadata.project.name}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-black">
                  단위: {mockMetadata.project.unit} - Discipline: {" "}
                  {disciplines.join(", ")}
                </p>
              </div>
              <button
                className="hidden rounded-lg border border-black bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-gray-100 md:block"
                type="button"
              >
                새 업로드
              </button>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-black">
              <SectionTitle>Drawing 목록</SectionTitle>
              <ul className="mt-4 space-y-3">
                {drawings.map((drawing) => (
                  <li
                    key={drawing.id}
                    className="flex flex-col gap-3 rounded-lg border border-black bg-white p-4 transition hover:bg-gray-100 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-black">
                        {drawing.name}
                      </p>
                      <p className="mt-1 text-xs text-black">
                        {drawing.id} - 상위 {drawing.parent ?? "없음"}
                      </p>
                    </div>
                    <span className="w-fit rounded-md border border-black bg-white px-3 py-1 text-xs font-semibold text-black">
                      {drawing.image}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-black bg-white p-6 shadow-sm">
              <SectionTitle>오늘</SectionTitle>
              <div className="mt-4 space-y-4">
                <div className="rounded-lg border border-black bg-gray-100 p-4 text-black">
                  <p className="text-sm font-bold">대기 중인 Revision 3건</p>
                  <p className="mt-1 text-xs font-medium">
                    MEP Drawing Review 대기열이 증가 중입니다.
                  </p>
                </div>
                <div className="rounded-lg border border-black bg-white p-4">
                  <p className="text-sm font-semibold">승인 전송 2건</p>
                  <p className="mt-1 text-xs text-black">
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
