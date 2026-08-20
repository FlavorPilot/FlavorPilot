import Link from "next/link";
import type { Locale } from "../i18n/config";
import type { Dictionary } from "../i18n/dictionaries";
import { ChefIcon, ArrowIcon } from "./icons";
import { LanguageSwitcher } from "./language-switcher";

export function SiteHeader({ locale, dictionary }: { locale: Locale; dictionary: Dictionary }) {
  const links = [
    ["builder", dictionary.nav.builder],
    ["discover", dictionary.nav.discover],
    ["library", dictionary.nav.library],
    ["pricing", dictionary.nav.pricing]
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0d0b]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href={`/${locale}`} className="group flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#b8f36b] text-[#0a0d0b] shadow-[0_8px_28px_rgba(184,243,107,.24)] transition group-hover:rotate-3">
            <ChefIcon size={21} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-black tracking-[0.02em] text-white">
              {dictionary.brand.name}
            </span>
            <span className="block truncate text-[11px] font-medium uppercase tracking-[0.16em] text-white/45">
              {dictionary.brand.descriptor}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={`/${locale}/${href}`}
              className="rounded-full px-4 py-2 text-sm font-medium text-white/62 transition hover:bg-white/[0.05] hover:text-white"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher locale={locale} />
          <Link
            href={`/${locale}/builder`}
            className="hidden h-10 items-center gap-2 rounded-full bg-[#b8f36b] px-4 text-sm font-bold text-[#0a0d0b] transition hover:bg-[#cdfb94] sm:inline-flex"
          >
            {dictionary.nav.start}
            <ArrowIcon size={16} />
          </Link>
        </div>
      </div>
      <nav className="scrollbar-thin mx-auto flex max-w-7xl gap-1 overflow-x-auto border-t border-white/[0.05] px-3 py-2 lg:hidden" aria-label="Mobile navigation">
        {links.map(([href, label]) => (
          <Link
            key={href}
            href={`/${locale}/${href}`}
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-white/52 transition hover:bg-white/[0.05] hover:text-white"
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
