import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowIcon, ChartIcon, GlobeIcon, LockIcon, RemixIcon, SparklesIcon } from "../../components/icons";
import { ProfileBar } from "../../components/profile-bar";
import { ScoreGauge } from "../../components/score-gauge";
import { defaultDish, ingredientById } from "@flavorpilot/flavor-engine";
import { analyzeDish } from "@flavorpilot/flavor-engine";
import { sensoryDimensions } from "@flavorpilot/flavor-engine";
import { isLocale } from "../../i18n/config";
import { getDictionary } from "../../i18n/dictionaries";

export default async function HomePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  const analysis = analyzeDish(defaultDish, "fresh");
  const selectedDimensions = sensoryDimensions.filter((dimension) =>
    ["sweetness", "acidity", "umami", "fat", "freshness", "pungency"].includes(dimension)
  );

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="grid-glow absolute inset-0 opacity-55" />
        <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.03fr_.97fr] lg:px-8 lg:py-24">
          <div className="animate-rise max-w-3xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#b8f36b]/20 bg-[#b8f36b]/[0.07] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#cdfb94]">
              <SparklesIcon size={15} />
              {dictionary.home.eyebrow}
            </div>
            <h1 className="text-balance text-5xl font-black leading-[.96] tracking-[-0.055em] text-white sm:text-6xl lg:text-8xl">
              {dictionary.home.titleA}
              <span className="mt-2 block text-[#b8f36b]">{dictionary.home.titleB}</span>
            </h1>
            <p className="mt-7 max-w-2xl text-balance text-lg leading-8 text-white/58 sm:text-xl">
              {dictionary.home.subtitle}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/${locale}/builder`}
                className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-[#b8f36b] px-6 text-sm font-black text-[#0a0d0b] transition hover:-translate-y-0.5 hover:bg-[#cdfb94]"
              >
                {dictionary.home.primaryCta}
                <ArrowIcon size={18} />
              </Link>
              <Link
                href={`/${locale}/discover`}
                className="inline-flex h-13 items-center justify-center rounded-full border border-white/12 bg-white/[0.035] px-6 text-sm font-bold text-white/80 transition hover:border-white/25 hover:text-white"
              >
                {dictionary.home.secondaryCta}
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/38">
              <span>Next.js 16</span>
              <span>TypeScript</span>
              <span>Deterministic engine</span>
              <span>EN / UK</span>
            </div>
          </div>

          <div className="animate-rise surface relative overflow-hidden rounded-[2rem] p-5 sm:p-7" style={{ animationDelay: "120ms" }}>
            <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-[#b8f36b]/10 blur-3xl" />
            <div className="relative flex items-center justify-between gap-4 border-b border-white/[0.07] pb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#b8f36b]">
                  {dictionary.home.liveLabel}
                </p>
                <h2 className="mt-2 text-xl font-black text-white">
                  {locale === "uk" ? "Тартар з лосося" : "Salmon tartare"}
                </h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/48">
                {dictionary.common.demo}
              </span>
            </div>

            <div className="relative grid gap-6 py-6 sm:grid-cols-[auto_1fr] sm:items-center">
              <ScoreGauge score={analysis.overallScore} label={dictionary.builder.overall} />
              <div className="grid grid-cols-2 gap-3">
                {[
                  [dictionary.builder.compatibility, analysis.compatibilityScore],
                  [dictionary.builder.balance, analysis.balanceScore],
                  [dictionary.builder.quantity, analysis.quantityScore],
                  [dictionary.builder.texture, analysis.textureScore]
                ].map(([label, score]) => (
                  <div key={String(label)} className="surface-soft rounded-2xl p-4">
                    <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">
                      {label}
                    </span>
                    <strong className="mt-2 block text-2xl font-black tabular-nums text-white">
                      {score}
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 border-y border-white/[0.07] py-5">
              {defaultDish.map((item) => {
                const ingredient = ingredientById.get(item.ingredientId);
                if (!ingredient) return null;
                return (
                  <div key={item.ingredientId} className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-semibold text-white/78">{ingredient.name[locale]}</span>
                    <span className="tabular-nums text-white/42">{item.grams} {dictionary.common.grams}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-2xl border border-[#b8f36b]/15 bg-[#b8f36b]/[0.055] p-4">
              <p className="text-xs font-black uppercase tracking-[0.13em] text-[#cdfb94]">
                {dictionary.home.explanationTitle}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/66">{dictionary.home.explanation}</p>
              <p className="mt-3 text-sm font-bold text-white">{dictionary.home.addSuggestion}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b8f36b]">Flavor Engine</p>
          <h2 className="mt-4 text-balance text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl">
            {dictionary.home.engineTitle}
          </h2>
          <p className="mt-5 text-lg leading-8 text-white/55">{dictionary.home.engineSubtitle}</p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {([
            { index: "01", title: dictionary.home.step1Title, text: dictionary.home.step1Text, Icon: GlobeIcon },
            { index: "02", title: dictionary.home.step2Title, text: dictionary.home.step2Text, Icon: ChartIcon },
            { index: "03", title: dictionary.home.step3Title, text: dictionary.home.step3Text, Icon: SparklesIcon }
          ] satisfies Array<{
            index: string;
            title: string;
            text: string;
            Icon: typeof GlobeIcon;
          }>).map(({ index, title, text, Icon }) => (
            <article key={index} className="surface rounded-[1.7rem] p-6 sm:p-7">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-[0.16em] text-white/30">{index}</span>
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/[0.05] text-[#b8f36b]">
                  <Icon size={19} />
                </span>
              </div>
              <h3 className="mt-10 text-2xl font-black text-white">{title}</h3>
              <p className="mt-3 leading-7 text-white/52">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/[0.06] bg-white/[0.018]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:px-8 lg:py-24">
          <div className="surface rounded-[2rem] p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-white/35">
              {dictionary.builder.profile}
            </p>
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              {selectedDimensions.map((dimension) => (
                <ProfileBar
                  key={dimension}
                  label={dictionary.dimensions[dimension]}
                  value={analysis.profile[dimension]}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <div className="grid gap-5 sm:grid-cols-2">
              <article className="rounded-[1.7rem] border border-white/[0.08] bg-[#121713] p-6">
                <RemixIcon className="text-[#b8f36b]" size={24} />
                <h3 className="mt-7 text-2xl font-black text-white">{dictionary.home.socialTitle}</h3>
                <p className="mt-3 leading-7 text-white/52">{dictionary.home.socialText}</p>
              </article>
              <article className="rounded-[1.7rem] border border-white/[0.08] bg-[#121713] p-6">
                <LockIcon className="text-[#b8f36b]" size={24} />
                <h3 className="mt-7 text-2xl font-black text-white">{dictionary.home.privateTitle}</h3>
                <p className="mt-3 leading-7 text-white/52">{dictionary.home.privateText}</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="relative overflow-hidden rounded-[2.2rem] border border-[#b8f36b]/20 bg-[#b8f36b] px-6 py-12 text-[#0a0d0b] sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-12 lg:px-14 lg:py-14">
          <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border-[38px] border-black/[0.055]" />
          <div className="relative max-w-3xl">
            <h2 className="text-balance text-4xl font-black tracking-[-0.045em] sm:text-5xl">
              {dictionary.home.closingTitle}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-black/62">{dictionary.home.closingText}</p>
          </div>
          <Link
            href={`/${locale}/builder`}
            className="relative mt-8 inline-flex h-13 shrink-0 items-center justify-center gap-2 rounded-full bg-[#0a0d0b] px-6 text-sm font-black text-white transition hover:-translate-y-0.5 lg:mt-0"
          >
            {dictionary.home.closingCta}
            <ArrowIcon size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}
