import { cn } from "@/shared/lib";

const Header = () => {
  return (
    <header className={cn(
      "flex items-center justify-between border-b shadow-sm",
      "border-concrete-300 bg-surface px-4 py-4 md:px-8"
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "h-9 w-9 rounded-lg flex items-center justify-center",
          "bg-iron-800 text-white text-sm font-bold"
        )}>
          SD
        </div>
        <div>
          <p className={cn(
            "text-sm font-semibold",
            "text-concrete-900 dark:text-concrete-100"
          )}>
            Project SiteDraw
          </p>
          <p className={cn(
            "text-xs",
            "text-concrete-600 dark:text-concrete-400"
          )}>
            건설 Drawing 탐색기
          </p>
        </div>
      </div>
      <div className="hidden items-center gap-3 text-xs md:flex">
        <span className={cn(
          "rounded-md px-3 py-1 font-medium",
          "bg-concrete-200 text-concrete-700",
          "dark:bg-concrete-700 dark:text-concrete-300"
        )}>
          Mock 모드
        </span>
        <span className={cn(
          "rounded-md px-3 py-1 font-medium",
          "bg-safety-500 text-concrete-900"
        )}>
          Tablet 대응
        </span>
      </div>
    </header>
  );
};

export default Header;
