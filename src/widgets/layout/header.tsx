import { cn } from "@/shared/lib";

const Header = () => {
  return (
    <header className={cn(
      "flex items-center justify-between border-b shadow-sm",
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
      <div className="hidden items-center gap-3 text-xs md:flex">
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
