"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/shared/lib";

const NAVIGATION_ITEMS = [
  { label: "대시보드", href: "#dashboard" },
  { label: "Drawing 세트", href: "#drawings" },
  { label: "Revision 이력", href: "#revisions" },
  { label: "승인 대기", href: "#approvals" },
  { label: "현장 메모", href: "#notes" },
] as const;

const HEADER_STYLES = {
  container: "flex flex-wrap items-center justify-between gap-4 border-b border-black bg-white shadow-sm p-4 md:px-8",
  logoButton: "size-9 rounded-lg flex items-center justify-center bg-white text-white text-sm font-bold transition hover:opacity-80 cursor-pointer",
  title: "text-sm font-semibold text-black",
  subtitle: "text-xs text-black",
  navList: "flex flex-wrap items-center gap-2 text-xs",
  navButton: "rounded-full border border-black px-3 py-1 font-semibold text-black transition hover:bg-gray-100",
  badge: "rounded-md border border-black px-3 py-1 font-medium text-black",
} as const;

const Header = () => {
  const router = useRouter();

  const handleLogoClick = () => {
    router.push("/");
    router.refresh();
  };

  return (
    <header className={HEADER_STYLES.container}>
      <button
        onClick={handleLogoClick}
        className="flex items-center gap-3 transition hover:opacity-80"
        title="홈으로 돌아가기"
      >
        <div className={HEADER_STYLES.logoButton}>
          <Image 
            src="/icon.png" 
            alt="Project SiteDraw Logo" 
            width={36} 
            height={36}
            className="rounded-lg"
          />
        </div>
        <div>
          <p className={HEADER_STYLES.title}>Project SiteDraw</p>
          <p className={HEADER_STYLES.subtitle}>건설 Drawing 탐색기</p>
        </div>
      </button>
      <nav className="order-3 w-full md:order-2 md:w-auto">
        <ul className={HEADER_STYLES.navList}>
          {NAVIGATION_ITEMS.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                className={HEADER_STYLES.navButton}
              >
                {item.label}
              </a>
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
