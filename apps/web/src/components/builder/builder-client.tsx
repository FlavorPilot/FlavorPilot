"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  GlobeIcon,
  LinkIcon,
  LockIcon,
  PlusIcon,
  SaveIcon,
  SearchIcon,
  SparklesIcon,
  TrashIcon
} from "../icons";
import { ProfileBar } from "../profile-bar";
import { ScoreGauge } from "../score-gauge";
import {
  defaultDish,
  ingredientById,
  ingredients,
  preparationById
} from "@flavorpilot/flavor-engine";
import { analyzeDish } from "@flavorpilot/flavor-engine";
import {
  sensoryDimensions,
  type DishGoal,
  type DishItem,
  type SavedDish
} from "@flavorpilot/flavor-engine";
import type { Locale } from "../../i18n/config";
import type { Dictionary } from "../../i18n/dictionaries";
import { formatIssue } from "../../i18n/format";
import { buildDishNarrative } from "../../i18n/narrative";
import { consumeRemixPayload, readSavedDishes, upsertSavedDish } from "../../lib/storage";

const goals: DishGoal[] = [
  "balanced",
  "fresh",
  "rich",
  "spicy",
  "sweetSour",
  "smoky",
  "umami",
  "light",
  "creamy",
  "crunchy"
];

const visibleDimensions = sensoryDimensions.filter((dimension) =>
  [
    "sweetness",
    "acidity",
    "saltiness",
    "bitterness",
    "umami",
    "fat",
    "pungency",
    "freshness"
  ].includes(dimension)
);

const visibilityOptions = ["public", "unlisted", "private"] as const;

type Visibility = (typeof visibilityOptions)[number];

const visibilityIcon = {
  public: GlobeIcon,
  unlisted: LinkIcon,
  private: LockIcon
};

export function BuilderClient({
  locale,
  dictionary
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const [items, setItems] = useState<DishItem[]>(defaultDish);
  const [goal, setGoal] = useState<DishGoal>("fresh");
  const [dishName, setDishName] = useState(locale === "uk" ? "Тартар з лосося" : "Salmon tartare");
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [parentDishId, setParentDishId] = useState<string | undefined>();
  const [currentDishId, setCurrentDishId] = useState<string | undefined>();
  const [originalCreatedAt, setOriginalCreatedAt] = useState<string | undefined>();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const payload = consumeRemixPayload();
    if (!payload) return;
    setItems(payload.items);
    setGoal(payload.goal);
    setDishName(payload.name);
    setParentDishId(payload.parentDishId);
    setCurrentDishId(payload.dishId);
    setOriginalCreatedAt(payload.createdAt);
    if (payload.visibility) setVisibility(payload.visibility);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const analysis = useMemo(() => analyzeDish(items, goal), [items, goal]);
  const narrative = useMemo(
    () => buildDishNarrative(analysis, locale, dictionary),
    [analysis, dictionary, locale]
  );

  const filteredIngredients = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase(locale);
    return ingredients
      .filter((ingredient) => !items.some((item) => item.ingredientId === ingredient.id))
      .filter((ingredient) => {
        if (!normalized) return true;
        return `${ingredient.name[locale]} ${ingredient.category[locale]}`
          .toLocaleLowerCase(locale)
          .includes(normalized);
      })
      .slice(0, 10);
  }, [items, locale, search]);

  const addIngredient = (ingredientId: string, grams?: number) => {
    if (items.some((item) => item.ingredientId === ingredientId)) {
      setNotice(dictionary.builder.duplicate);
      return;
    }
    if (items.length >= 12) {
      setNotice(dictionary.builder.maxItems);
      return;
    }
    const ingredient = ingredientById.get(ingredientId);
    if (!ingredient) return;
    const preparationId = ingredient.preparations.includes("raw")
      ? "raw"
      : ingredient.preparations[0];
    const estimatedGrams =
      grams ??
      Math.max(
        ingredient.share.ideal < 3 ? 1 : 8,
        Math.round(Math.max(analysis.totalWeight, 240) * (ingredient.share.ideal / 100))
      );
    setItems((current) => [
      ...current,
      { ingredientId, grams: estimatedGrams, preparationId }
    ]);
    setSearch("");
    setSearchOpen(false);
    setNotice(null);
  };

  const updateItem = (index: number, patch: Partial<DishItem>) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              ...patch,
              grams:
                patch.grams === undefined
                  ? item.grams
                  : Math.max(0.1, Math.min(5000, patch.grams))
            }
          : item
      )
    );
  };

  const removeItem = (index: number) => {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const saveDish = () => {
    const savedDishes = readSavedDishes();
    const privateDishCount = savedDishes.filter(
      (dish) => dish.visibility === "private" && dish.id !== currentDishId
    ).length;

    if (visibility === "private" && privateDishCount >= 3) {
      setNotice(dictionary.builder.privateLimit);
      return;
    }

    const id = currentDishId ?? crypto.randomUUID();
    const createdAt = originalCreatedAt ?? new Date().toISOString();
    const dish: SavedDish = {
      id,
      name: dishName.trim() || (locale === "uk" ? "Нова страва" : "Untitled dish"),
      items,
      goal,
      visibility,
      createdAt,
      parentDishId
    };
    if (!upsertSavedDish(dish)) {
      setNotice(dictionary.builder.saveFailed);
      return;
    }
    setCurrentDishId(id);
    setOriginalCreatedAt(createdAt);
    setNotice(dictionary.builder.savedLocally);
  };

  const reset = () => {
    setItems(defaultDish);
    setGoal("fresh");
    setDishName(locale === "uk" ? "Тартар з лосося" : "Salmon tartare");
    setParentDishId(undefined);
    setCurrentDishId(undefined);
    setOriginalCreatedAt(undefined);
    setVisibility("private");
    setNotice(null);
  };

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="mb-9 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#b8f36b]">
            <SparklesIcon size={15} /> Flavor Engine
          </div>
          <h1 className="text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl">
            {dictionary.builder.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-white/52">
            {dictionary.builder.subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="self-start rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/58 transition hover:border-white/25 hover:text-white lg:self-auto"
        >
          {dictionary.builder.reset}
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.03fr)_minmax(420px,.97fr)]">
        <section className="surface rounded-[2rem] p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.13em] text-white/40">
                {dictionary.builder.dishName}
              </span>
              <input
                value={dishName}
                onChange={(event) => setDishName(event.target.value)}
                placeholder={dictionary.builder.dishNamePlaceholder}
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 font-semibold text-white outline-none transition placeholder:text-white/26 focus:border-[#b8f36b]/50"
              />
            </label>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-right">
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
                {dictionary.common.ingredients}
              </span>
              <strong className="text-xl tabular-nums text-white">{items.length}</strong>
              <span className="ml-2 text-sm tabular-nums text-white/38">
                {analysis.totalWeight} {dictionary.common.grams}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.13em] text-white/40">
              {dictionary.builder.direction}
            </p>
            <div className="flex flex-wrap gap-2">
              {goals.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setGoal(item)}
                  aria-pressed={goal === item}
                  className={`rounded-full border px-3.5 py-2 text-xs font-bold transition ${
                    goal === item
                      ? "border-[#b8f36b]/55 bg-[#b8f36b] text-[#0a0d0b]"
                      : "border-white/[0.08] bg-white/[0.025] text-white/55 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {dictionary.goals[item]}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-7 border-t border-white/[0.07] pt-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-white">{dictionary.builder.composition}</h2>
              <span className="text-xs text-white/36">{items.length}/12</span>
            </div>

            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/12 px-6 py-12 text-center">
                  <h3 className="font-black text-white">{dictionary.builder.emptyTitle}</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/44">
                    {dictionary.builder.emptyText}
                  </p>
                </div>
              ) : (
                items.map((item, index) => {
                  const ingredient = ingredientById.get(item.ingredientId);
                  if (!ingredient) return null;
                  return (
                    <div
                      key={`${item.ingredientId}-${index}`}
                      className="grid gap-3 rounded-3xl border border-white/[0.075] bg-white/[0.025] p-3 sm:grid-cols-[minmax(150px,1fr)_110px_minmax(140px,.8fr)_42px] sm:items-center"
                    >
                      <div className="min-w-0 px-1">
                        <p className="truncate font-bold text-white">{ingredient.name[locale]}</p>
                        <p className="mt-0.5 text-xs text-white/34">{ingredient.category[locale]}</p>
                      </div>
                      <label className="relative">
                        <span className="sr-only">{dictionary.common.grams}</span>
                        <input
                          type="number"
                          min="0.1"
                          step={item.grams < 5 ? "0.1" : "1"}
                          value={item.grams}
                          onChange={(event) =>
                            updateItem(index, { grams: Number(event.target.value) || 0.1 })
                          }
                          className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#0d120f] px-3 pr-8 text-right font-bold tabular-nums text-white outline-none focus:border-[#b8f36b]/50"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30">
                          {dictionary.common.grams}
                        </span>
                      </label>
                      <select
                        value={item.preparationId}
                        aria-label={`${dictionary.common.preparation}: ${ingredient.name[locale]}`}
                        onChange={(event) => updateItem(index, { preparationId: event.target.value })}
                        className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#0d120f] px-3 text-sm font-semibold text-white/70 outline-none focus:border-[#b8f36b]/50"
                      >
                        {ingredient.preparations.map((preparationId) => {
                          const preparation = preparationById.get(preparationId);
                          if (!preparation) return null;
                          return (
                            <option key={preparationId} value={preparationId}>
                              {preparation.name[locale]}
                            </option>
                          );
                        })}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.07] text-white/35 transition hover:border-[#ff8f7d]/25 hover:bg-[#ff8f7d]/[0.06] hover:text-[#ff9f90]"
                        aria-label={`${dictionary.common.remove} ${ingredient.name[locale]}`}
                      >
                        <TrashIcon size={17} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div ref={searchRef} className="relative mt-4">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder={dictionary.builder.ingredientSearchPlaceholder}
                  className="h-[3.25rem] w-full rounded-2xl border border-[#b8f36b]/18 bg-[#b8f36b]/[0.045] pl-11 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-white/27 focus:border-[#b8f36b]/50"
                />
              </div>
              {searchOpen && (
                <div className="scrollbar-thin absolute inset-x-0 top-[calc(100%+.5rem)] z-30 max-h-80 overflow-y-auto rounded-2xl border border-white/10 bg-[#121713] p-2 shadow-2xl">
                  {filteredIngredients.length === 0 ? (
                    <p className="px-4 py-5 text-center text-sm text-white/40">
                      {dictionary.common.noResults}
                    </p>
                  ) : (
                    filteredIngredients.map((ingredient) => (
                      <button
                        key={ingredient.id}
                        type="button"
                        onClick={() => addIngredient(ingredient.id)}
                        className="flex w-full items-center justify-between gap-4 rounded-xl px-3 py-3 text-left transition hover:bg-white/[0.055]"
                      >
                        <span>
                          <span className="block text-sm font-bold text-white/82">
                            {ingredient.name[locale]}
                          </span>
                          <span className="mt-0.5 block text-xs text-white/34">
                            {ingredient.category[locale]}
                          </span>
                        </span>
                        <PlusIcon className="text-[#b8f36b]" size={18} />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {notice && (
              <p aria-live="polite" className="mt-3 rounded-xl border border-[#b8f36b]/15 bg-[#b8f36b]/[0.045] px-4 py-3 text-sm text-white/64">
                {notice}
              </p>
            )}
          </div>

          <div className="mt-8 border-t border-white/[0.07] pt-6">
            <h2 className="text-lg font-black text-white">{dictionary.builder.saveDish}</h2>
            <p className="mt-1 text-sm leading-6 text-white/40">{dictionary.builder.visibilityHelp}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {visibilityOptions.map((option) => {
                const Icon = visibilityIcon[option];
                const title = dictionary.visibility[`${option}Title` as keyof typeof dictionary.visibility];
                const text = dictionary.visibility[`${option}Text` as keyof typeof dictionary.visibility];
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setVisibility(option)}
                    aria-pressed={visibility === option}
                    className={`rounded-2xl border p-4 text-left transition ${
                      visibility === option
                        ? "border-[#b8f36b]/50 bg-[#b8f36b]/[0.075]"
                        : "border-white/[0.075] bg-white/[0.02] hover:border-white/18"
                    }`}
                  >
                    <Icon size={18} className={visibility === option ? "text-[#b8f36b]" : "text-white/36"} />
                    <strong className="mt-4 block text-sm text-white">{title}</strong>
                    <span className="mt-1.5 block text-xs leading-5 text-white/38">{text}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={saveDish}
              disabled={items.length === 0}
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#b8f36b] px-5 text-sm font-black text-[#0a0d0b] transition hover:bg-[#cdfb94] disabled:cursor-not-allowed disabled:opacity-35"
            >
              <SaveIcon size={18} />
              {dictionary.common.save}
            </button>
          </div>
        </section>

        <section className="space-y-5 xl:sticky xl:top-20 xl:self-start">
          <div className="surface rounded-[2rem] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#b8f36b]">
                  {dictionary.builder.analysis}
                </p>
                <h2 className="mt-2 text-xl font-black text-white">{dishName || dictionary.builder.title}</h2>
              </div>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-xs font-semibold text-white/45">
                {dictionary.goals[goal]}
              </span>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
              <ScoreGauge score={analysis.overallScore} label={dictionary.builder.overall} />
              <div className="grid grid-cols-2 gap-3">
                {[
                  [dictionary.builder.compatibility, analysis.compatibilityScore],
                  [dictionary.builder.balance, analysis.balanceScore],
                  [dictionary.builder.quantity, analysis.quantityScore],
                  [dictionary.builder.texture, analysis.textureScore]
                ].map(([label, score]) => (
                  <div key={String(label)} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">
                      {label}
                    </span>
                    <strong className="mt-2 block text-2xl font-black tabular-nums text-white">
                      {score}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-[#b8f36b]/15 bg-[#b8f36b]/[0.045] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#cdfb94]">
                {dictionary.builder.engineSummary}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/65">{narrative.summary}</p>
              {narrative.nextMove && (
                <p className="mt-3 text-sm leading-6 text-white/78">
                  <strong className="text-white">{dictionary.builder.bestNextMove}: </strong>
                  {narrative.nextMove}
                </p>
              )}
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-4 text-xs text-white/38">
              <span>{dictionary.builder.confidence}</span>
              <strong className="tabular-nums text-white/66">{analysis.confidence}%</strong>
            </div>
          </div>

          <div className="surface rounded-[2rem] p-5 sm:p-6">
            <h2 className="text-lg font-black text-white">{dictionary.builder.profile}</h2>
            <div className="mt-5 grid gap-x-5 gap-y-4 sm:grid-cols-2">
              {visibleDimensions.map((dimension) => (
                <ProfileBar
                  key={dimension}
                  label={dictionary.dimensions[dimension]}
                  value={analysis.profile[dimension]}
                />
              ))}
            </div>
          </div>

          <div className="surface rounded-[2rem] p-5 sm:p-6">
            <h2 className="text-lg font-black text-white">{dictionary.builder.insights}</h2>
            <div className="mt-4 space-y-3">
              {analysis.issues.length === 0 ? (
                <div className="rounded-2xl border border-[#b8f36b]/15 bg-[#b8f36b]/[0.045] p-4 text-sm leading-6 text-white/62">
                  {dictionary.builder.noIssues}
                </div>
              ) : (
                analysis.issues.map((issue, index) => (
                  <div
                    key={`${issue.code}-${index}`}
                    className={`rounded-2xl border p-4 text-sm leading-6 ${
                      issue.severity === "critical"
                        ? "border-[#ff8f7d]/25 bg-[#ff8f7d]/[0.055] text-[#ffc0b5]"
                        : issue.severity === "warning"
                          ? "border-[#f3c867]/20 bg-[#f3c867]/[0.045] text-[#f8dda2]"
                          : "border-white/[0.08] bg-white/[0.025] text-white/58"
                    }`}
                  >
                    {formatIssue(issue, locale, dictionary)}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      <section className="surface mt-5 rounded-[2rem] p-5 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-white">{dictionary.builder.recommendations}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/42">
              {dictionary.builder.recommendationHelp}
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {analysis.recommendations.slice(0, 8).map((recommendation) => {
            const ingredient = ingredientById.get(recommendation.ingredientId);
            if (!ingredient) return null;
            return (
              <article key={recommendation.ingredientId} className="rounded-3xl border border-white/[0.075] bg-white/[0.024] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-white">{ingredient.name[locale]}</h3>
                    <p className="mt-1 text-xs text-white/33">{ingredient.category[locale]}</p>
                  </div>
                  <span className="rounded-full bg-[#b8f36b]/10 px-2.5 py-1 text-xs font-black tabular-nums text-[#cdfb94]">
                    {recommendation.utility}%
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-white/[0.035] p-2.5">
                    <span className="block text-white/32">{dictionary.builder.compatibilityLabel}</span>
                    <strong className="mt-1 block tabular-nums text-white/80">{recommendation.compatibility}%</strong>
                  </div>
                  <div className="rounded-xl bg-white/[0.035] p-2.5">
                    <span className="block text-white/32">{dictionary.common.grams}</span>
                    <strong className="mt-1 block tabular-nums text-white/80">
                      {recommendation.recommendedGrams} {dictionary.common.grams}
                    </strong>
                  </div>
                </div>
                <p className="mt-3 text-xs font-semibold text-[#b8f36b]">
                  {recommendation.balanceDelta >= 0 ? "+" : ""}{recommendation.balanceDelta} {dictionary.builder.expectedChange}
                </p>
                <div className="mt-3 flex min-h-12 flex-wrap content-start gap-1.5">
                  {recommendation.reasons.map((reason) => (
                    <span key={reason} className="rounded-full border border-white/[0.07] px-2 py-1 text-[10px] font-semibold text-white/42">
                      {dictionary.reasons[reason]}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => addIngredient(recommendation.ingredientId, recommendation.recommendedGrams)}
                  className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#b8f36b]/22 bg-[#b8f36b]/[0.06] text-xs font-black text-[#cdfb94] transition hover:bg-[#b8f36b] hover:text-[#0a0d0b]"
                >
                  <PlusIcon size={15} />
                  {dictionary.common.add}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {analysis.pairResults.length > 0 && (
        <section className="surface mt-5 rounded-[2rem] p-5 sm:p-6 lg:p-7">
          <h2 className="text-2xl font-black text-white">{dictionary.builder.pairs}</h2>
          <div className="scrollbar-thin mt-5 overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-[11px] font-bold uppercase tracking-[0.12em] text-white/32">
                  <th className="px-3 py-3">{dictionary.builder.pair}</th>
                  <th className="px-3 py-3">{dictionary.common.score}</th>
                  <th className="px-3 py-3">{dictionary.builder.aromaOverlap}</th>
                  <th className="px-3 py-3">{dictionary.builder.complement}</th>
                </tr>
              </thead>
              <tbody>
                {[...analysis.pairResults]
                  .sort((a, b) => b.score - a.score)
                  .map((pair) => {
                    const left = ingredientById.get(pair.ingredientAId);
                    const right = ingredientById.get(pair.ingredientBId);
                    if (!left || !right) return null;
                    return (
                      <tr key={`${pair.ingredientAId}-${pair.ingredientBId}`} className="border-b border-white/[0.055] last:border-0">
                        <td className="px-3 py-4 font-semibold text-white/72">
                          {left.name[locale]} <span className="mx-1 text-white/22">↔</span> {right.name[locale]}
                        </td>
                        <td className="px-3 py-4 font-black tabular-nums text-white">{pair.score}%</td>
                        <td className="px-3 py-4 tabular-nums text-white/46">{pair.aromaOverlap}%</td>
                        <td className="px-3 py-4 tabular-nums text-white/46">{pair.complementScore}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
