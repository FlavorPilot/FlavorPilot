import { notFound } from "next/navigation";
import { LibraryClient } from "../../../components/library-client";
import { isLocale } from "../../../i18n/config";
import { getDictionary } from "../../../i18n/dictionaries";

export default async function LibraryPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <LibraryClient locale={locale} dictionary={getDictionary(locale)} />;
}
