const Sidebar = () => {
  return (
    <aside className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        내비게이션
      </p>
      <nav className="mt-4 space-y-2 text-sm">
        {[
          "대시보드",
          "Drawing 세트",
          "Revision 이력",
          "승인 대기",
          "현장 메모",
        ].map((item) => (
          <button
            key={item}
            className="w-full rounded-xl px-3 py-2 text-left text-slate-700 transition hover:bg-slate-100"
            type="button"
          >
            {item}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
