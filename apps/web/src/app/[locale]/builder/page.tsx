import { notFound } from "next/navigation";
import { BuilderClient } from "../../../components/builder/builder-client";
import { isLocale } from "../../../i18n/config";
import { getDictionary } from "../../../i18n/dictionaries";

export default async function BuilderPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <BuilderClient locale={locale} dictionary={getDictionary(locale)} />;
}
