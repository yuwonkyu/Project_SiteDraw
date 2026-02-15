import { cn } from "@/shared/lib";

const navigationItems = [
  "대시보드",
  "Drawing 세트",
  "Revision 이력",
  "승인 대기",
  "현장 메모",
];

const Header = () => {
  return (
    <header className={cn(
      "flex flex-wrap items-center justify-between gap-4 border-b shadow-sm",
      "border-black bg-white px-4 py-4 md:px-8"
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "h-9 w-9 rounded-lg flex items-center justify-center",
          "bg-black text-white text-sm font-bold"
        )}>
          SD
        </div>
        <div>
          <p className={cn(
            "text-sm font-semibold text-black"
          )}>
            Project SiteDraw
          </p>
          <p className={cn(
            "text-xs text-black"
          )}>
            건설 Drawing 탐색기
          </p>
        </div>
      </div>
      <nav className="order-3 w-full md:order-2 md:w-auto">
        <ul className="flex flex-wrap items-center gap-2 text-xs">
          {navigationItems.map((item) => (
            <li key={item}>
              <button
                className="rounded-full border border-black px-3 py-1 font-semibold text-black transition hover:bg-gray-100"
                type="button"
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex items-center gap-3 text-xs md:order-3">
        <span className={cn(
          "rounded-md border border-black bg-white px-3 py-1 font-medium text-black"
        )}>
          Mock 모드
        </span>
        <span className={cn(
          "rounded-md border border-black bg-gray-100 px-3 py-1 font-medium text-black"
        )}>
          Tablet 대응
        </span>
      </div>
    </header>
  );
};

export default Header;
