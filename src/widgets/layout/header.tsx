"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

const HEADER_STYLES = {
  container:
    "flex flex-wrap items-center justify-between gap-4 border-b border-black bg-white shadow-sm p-4 md:px-8",
  logoButton:
    "size-9 rounded-lg flex items-center justify-center bg-white text-white text-sm font-bold transition hover:opacity-80 cursor-pointer",
  title: "text-sm font-semibold text-black",
  subtitle: "text-xs text-black",
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
    </header>
  );
};

export default Header;
