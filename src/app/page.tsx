import { Header, MainArea, Sidebar } from "@/widgets/layout";
import { mockMetadata } from "@/shared/mock";
import { SectionTitle } from "@/shared/ui";

const HomePage = () => {
  const drawings = Object.values(mockMetadata.drawings);
  const disciplines = mockMetadata.disciplines.map(
    (discipline) => discipline.name
  );

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <Header />
      <div className="grid grid-cols-1 gap-6 px-4 pb-8 pt-5 md:grid-cols-[240px_1fr] md:gap-8 md:px-8">
        <Sidebar />
        <MainArea>
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <SectionTitle>활성 Drawing 세트</SectionTitle>
                <h1 className="mt-3 text-2xl font-semibold text-slate-900">
                  {mockMetadata.project.name}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-500">
                  단위: {mockMetadata.project.unit} - Discipline: {" "}
                  {disciplines.join(", ")}
                </p>
              </div>
              <button
                className="hidden rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 md:block"
                type="button"
              >
                새 업로드
              </button>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <SectionTitle>Drawing 목록</SectionTitle>
              <ul className="mt-4 space-y-3">
                {drawings.map((drawing) => (
                  <li
                    key={drawing.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {drawing.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {drawing.id} - 상위 {drawing.parent ?? "없음"}
                      </p>
                    </div>
                    <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {drawing.image}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
              <SectionTitle>오늘</SectionTitle>
              <div className="mt-4 space-y-4">
                <div className="rounded-xl bg-white/10 p-4">
                  <p className="text-sm font-semibold">대기 중인 Revision 3건</p>
                  <p className="mt-1 text-xs text-white/70">
                    MEP Drawing Review 대기열이 증가 중입니다.
                  </p>
                </div>
                <div className="rounded-xl border border-white/20 p-4">
                  <p className="text-sm font-semibold">승인 전송 2건</p>
                  <p className="mt-1 text-xs text-white/70">
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
