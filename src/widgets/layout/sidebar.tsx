const Sidebar = () => {
  return (
    <aside className="rounded-lg bg-surface p-5 shadow-sm ring-1 ring-concrete-300 dark:ring-concrete-700">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-concrete-500 dark:text-concrete-400">
        내비게이션
      </p>
      <nav className="mt-4 space-y-1 text-sm">
        {[
          "대시보드",
          "Drawing 세트",
          "Revision 이력",
          "승인 대기",
          "현장 메모",
        ].map((item) => (
          <button
            key={item}
            className="w-full rounded-lg px-3 py-2.5 text-left font-medium text-concrete-700 transition hover:bg-concrete-100 dark:text-concrete-300 dark:hover:bg-concrete-800"
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
