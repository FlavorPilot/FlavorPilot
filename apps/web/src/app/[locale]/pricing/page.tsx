import { notFound } from "next/navigation";
import { CheckIcon } from "./pricing-icons";
import { isLocale } from "../../../i18n/config";
import { getDictionary } from "../../../i18n/dictionaries";

export default async function PricingPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  const plans = [
    {
      name: dictionary.pricing.freeName,
      price: dictionary.pricing.freePrice,
      description: dictionary.pricing.freeDescription,
      popular: false,
      features: [
        dictionary.pricing.featurePublic,
        dictionary.pricing.featurePrivate3,
        dictionary.pricing.featureBasicAnalysis
      ]
    },
    {
      name: dictionary.pricing.proName,
      price: dictionary.pricing.proPrice,
      description: dictionary.pricing.proDescription,
      popular: true,
      features: [
        dictionary.pricing.featureUnlimitedPrivate,
        dictionary.pricing.featureAdvancedAnalysis,
        dictionary.pricing.featureVersions,
        dictionary.pricing.featureQuantity
      ]
    },
    {
      name: dictionary.pricing.studioName,
      price: dictionary.pricing.studioPrice,
      description: dictionary.pricing.studioDescription,
      popular: false,
      features: [
        dictionary.pricing.featureCosting,
        dictionary.pricing.featureNutrition,
        dictionary.pricing.featureScaling,
        dictionary.pricing.featureExport
      ]
    }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b8f36b]">
          {dictionary.pricing.eyebrow}
        </p>
        <h1 className="mt-4 text-balance text-4xl font-black tracking-[-0.045em] text-white sm:text-6xl">
          {dictionary.pricing.title}
        </h1>
        <p className="mt-5 text-lg leading-8 text-white/50">{dictionary.pricing.subtitle}</p>
      </div>

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`relative rounded-[2rem] border p-6 sm:p-7 ${
              plan.popular
                ? "border-[#b8f36b]/45 bg-[#b8f36b]/[0.06] shadow-[0_24px_90px_rgba(184,243,107,.09)]"
                : "border-white/[0.08] bg-white/[0.025]"
            }`}
          >
            {plan.popular && (
              <span className="absolute right-5 top-5 rounded-full bg-[#b8f36b] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#0a0d0b]">
                {dictionary.pricing.popular}
              </span>
            )}
            <h2 className="text-2xl font-black text-white">{plan.name}</h2>
            <p className="mt-3 min-h-14 text-sm leading-6 text-white/43">{plan.description}</p>
            <div className="mt-7 flex items-end gap-2">
              <strong className="text-5xl font-black tracking-[-0.05em] text-white">{plan.price}</strong>
              <span className="pb-1 text-sm text-white/34">{dictionary.pricing.monthly}</span>
            </div>
            <div className="mt-8 space-y-3">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-start gap-3 text-sm leading-6 text-white/62">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#b8f36b]/12 text-[#b8f36b]">
                    <CheckIcon />
                  </span>
                  {feature}
                </div>
              ))}
            </div>
            <button
              type="button"
              className={`mt-9 h-12 w-full rounded-2xl text-sm font-black transition ${
                plan.popular
                  ? "bg-[#b8f36b] text-[#0a0d0b] hover:bg-[#cdfb94]"
                  : "border border-white/[0.1] bg-white/[0.035] text-white/72 hover:border-white/25 hover:text-white"
              }`}
            >
              {plan.name === dictionary.pricing.freeName
                ? dictionary.pricing.current
                : dictionary.pricing.choose}
            </button>
          </article>
        ))}
      </div>

      <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-6 text-white/35">
        {dictionary.pricing.note}
      </p>
    </div>
  );
}
