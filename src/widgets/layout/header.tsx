const Header = () => {
  return (
    <header className="flex items-center justify-between border-b border-concrete-300 bg-surface px-4 py-4 shadow-sm md:px-8">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-iron-800 text-white flex items-center justify-center text-sm font-bold">
          SD
        </div>
        <div>
          <p className="text-sm font-semibold text-concrete-900 dark:text-concrete-100">Project SiteDraw</p>
          <p className="text-xs text-concrete-600 dark:text-concrete-400">건설 Drawing 탐색기</p>
        </div>
      </div>
      <div className="hidden items-center gap-3 text-xs md:flex">
        <span className="rounded-md bg-concrete-200 px-3 py-1 font-medium text-concrete-700 dark:bg-concrete-700 dark:text-concrete-300">Mock 모드</span>
        <span className="rounded-md bg-safety-500 px-3 py-1 font-medium text-concrete-900">Tablet 대응</span>
      </div>
    </header>
  );
};

export default Header;
