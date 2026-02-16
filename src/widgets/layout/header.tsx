import { cn } from "@/shared/lib";

const NAVIGATION_ITEMS = [
  "대시보드",
  "Drawing 세트",
  "Revision 이력",
  "승인 대기",
  "현장 메모",
] as const;

const HEADER_STYLES = {
  container: "flex flex-wrap items-center justify-between gap-4 border-b border-black bg-white shadow-sm px-4 py-4 md:px-8",
  logo: "h-9 w-9 rounded-lg flex items-center justify-center bg-black text-white text-sm font-bold",
  title: "text-sm font-semibold text-black",
  subtitle: "text-xs text-black",
  navList: "flex flex-wrap items-center gap-2 text-xs",
  navButton: "rounded-full border border-black px-3 py-1 font-semibold text-black transition hover:bg-gray-100",
  badge: "rounded-md border border-black px-3 py-1 font-medium text-black",
} as const;

const Header = () => {
  return (
    <header className={HEADER_STYLES.container}>
      <div className="flex items-center gap-3">
        <div className={HEADER_STYLES.logo}>SD</div>
        <div>
          <p className={HEADER_STYLES.title}>Project SiteDraw</p>
          <p className={HEADER_STYLES.subtitle}>건설 Drawing 탐색기</p>
        </div>
      </div>
      <nav className="order-3 w-full md:order-2 md:w-auto">
        <ul className={HEADER_STYLES.navList}>
          {NAVIGATION_ITEMS.map((item) => (
            <li key={item}>
              <button
                className={HEADER_STYLES.navButton}
                type="button"
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex items-center gap-3 text-xs md:order-3">
        <span className={cn(HEADER_STYLES.badge, "bg-white")}>Mock 모드</span>
        <span className={cn(HEADER_STYLES.badge, "bg-gray-100")}>Tablet 대응</span>
      </div>
    </header>
  );
};

export default Header;
