const Header = () => {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-4 shadow-sm backdrop-blur md:px-8">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm font-semibold">
          SD
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Project SiteDraw</p>
          <p className="text-xs text-slate-500">건설 Drawing 탐색기</p>
        </div>
      </div>
      <div className="hidden items-center gap-3 text-xs text-slate-500 md:flex">
        <span className="rounded-full bg-slate-100 px-3 py-1">Mock 모드</span>
        <span className="rounded-full bg-slate-900 px-3 py-1 text-white">Tablet 대응</span>
      </div>
    </header>
  );
};

export default Header;
