"use client";

import { usePathname, useRouter } from "next/navigation";
import type { Locale } from "../i18n/config";
import { GlobeIcon } from "./icons";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();
  const nextLocale: Locale = locale === "en" ? "uk" : "en";

  const switchLanguage = () => {
    const parts = pathname.split("/");
    parts[1] = nextLocale;
    router.push(parts.join("/") || `/${nextLocale}`);
  };

  return (
    <button
      type="button"
      onClick={switchLanguage}
      className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-white/80 transition hover:border-[#b8f36b]/40 hover:text-white"
      aria-label={nextLocale === "uk" ? "Українська" : "English"}
    >
      <GlobeIcon size={16} />
      <span>{locale.toUpperCase()}</span>
    </button>
  );
}
