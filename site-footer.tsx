import Link from "next/link";
import type { Locale } from "../i18n/config";
import type { Dictionary } from "../i18n/dictionaries";

export function SiteFooter({ locale, dictionary }: { locale: Locale; dictionary: Dictionary }) {
  return (
    <footer className="border-t border-white/[0.06] py-8 text-sm text-white/45">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>© 2026 {dictionary.brand.name}. MVP.</p>
        <div className="flex flex-wrap gap-5">
          <Link href={`/${locale}/builder`} className="hover:text-white">{dictionary.nav.builder}</Link>
          <Link href={`/${locale}/discover`} className="hover:text-white">{dictionary.nav.discover}</Link>
          <Link href={`/${locale}/pricing`} className="hover:text-white">{dictionary.nav.pricing}</Link>
        </div>
      </div>
    </footer>
  );
}
