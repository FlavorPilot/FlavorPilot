import { notFound } from "next/navigation";
import { DiscoverClient } from "../../../components/discover-client";
import { isLocale } from "../../../i18n/config";
import { getDictionary } from "../../../i18n/dictionaries";

export default async function DiscoverPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <DiscoverClient locale={locale} dictionary={getDictionary(locale)} />;
}
