import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocaleDocumentSync } from "../../components/locale-document-sync";
import { SiteFooter } from "../../components/site-footer";
import { SiteHeader } from "../../components/site-header";
import { getDictionary } from "../../i18n/dictionaries";
import { isLocale, locales } from "../../i18n/config";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dictionary = getDictionary(locale);
  return {
    title: dictionary.meta.title,
    description: dictionary.meta.description,
    alternates: {
      languages: {
        en: "/en",
        uk: "/uk"
      }
    }
  };
}

export default async function LocaleLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);

  return (
    <>
      <LocaleDocumentSync locale={locale} />
      <SiteHeader locale={locale} dictionary={dictionary} />
      <main>{children}</main>
      <SiteFooter locale={locale} dictionary={dictionary} />
    </>
  );
}
