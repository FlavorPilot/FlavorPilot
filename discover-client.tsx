"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { publicDishSeeds, ingredientById } from "@tastecraft/flavor-engine";
import { analyzeDish } from "@tastecraft/flavor-engine";
import type { DishGoal, SavedDish } from "@tastecraft/flavor-engine";
import type { DishResponse } from "@tastecraft/contracts";
import type { Locale } from "../i18n/config";
import type { Dictionary } from "../i18n/dictionaries";
import { listPublicDishes } from "../lib/api/client";
import { readSavedDishes, setRemixPayload } from "../lib/storage";
import { ArrowIcon, RemixIcon, SearchIcon, SparklesIcon } from "./icons";
import { ScoreGauge } from "./score-gauge";

interface PublicDishView {
  id: string;
  name: string;
  author: string;
  goal: DishGoal;
  items: SavedDish["items"];
  saves: number;
  remixes: number;
  parentDishId?: string;
}

export function DiscoverClient({
  locale,
  dictionary
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [localPublic, setLocalPublic] = useState<SavedDish[]>([]);
  const [remotePublic, setRemotePublic] = useState<DishResponse[] | null>(null);

  useEffect(() => {
    const load = () => {
      setLocalPublic(readSavedDishes().filter((dish) => dish.visibility === "public"));
    };
    load();
    window.addEventListener("tastecraft:dishes-updated", load);
    return () => window.removeEventListener("tastecraft:dishes-updated", load);
  }, []);

  useEffect(() => {
    let active = true;
    listPublicDishes({ limit: 30 })
      .then((result) => {
        if (active) setRemotePublic(result.items);
      })
      .catch(() => {
        // The browser demo remains useful when the Nest API or database is not configured.
        if (active) setRemotePublic(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const dishes = useMemo<PublicDishView[]>(() => {
    const remote: PublicDishView[] = (remotePublic ?? []).map((dish) => ({
      id: dish.id,
      name: dish.name,
      author: dish.owner?.username ? `@${dish.owner.username}` : "@chef",
      goal: dish.goal,
      items: dish.items.map(({ ingredientId, grams, preparationId }) => ({
        ingredientId,
        grams,
        preparationId
      })),
      saves: 0,
      remixes: 0,
      parentDishId: dish.parentDishId ?? undefined
    }));
    const seed: PublicDishView[] = publicDishSeeds.map((dish) => ({
      id: dish.id,
      name: dish.name[locale],
      author: dish.author,
      goal: dish.goal,
      items: dish.items,
      saves: dish.saves,
      remixes: dish.remixes
    }));
    const local = localPublic.map((dish) => ({
      id: dish.id,
      name: dish.name,
      author: "@you",
      goal: dish.goal,
      items: dish.items,
      saves: 0,
      remixes: 0,
      parentDishId: dish.parentDishId
    }));
    return [...local, ...remote, ...(remote.length === 0 ? seed : [])];
  }, [localPublic, locale, remotePublic]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(locale);
    if (!normalized) return dishes;
    return dishes.filter((dish) => {
      const ingredientNames = dish.items
        .map((item) => ingredientById.get(item.ingredientId)?.name[locale] ?? "")
        .join(" ");
      return `${dish.name} ${ingredientNames}`
        .toLocaleLowerCase(locale)
        .includes(normalized);
    });
  }, [dishes, locale, query]);

  const remix = (dish: PublicDishView) => {
    setRemixPayload({
      name: `${dish.name} — ${dictionary.common.remix}`,
      items: dish.items,
      goal: dish.goal,
      parentDishId: dish.id
    });
    router.push(`/${locale}/builder`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="max-w-3xl">
        <div className="mb-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.17em] text-[#b8f36b]">
          <SparklesIcon size={15} />
          {dictionary.discover.eyebrow}
        </div>
        <h1 className="text-balance text-4xl font-black tracking-[-0.045em] text-white sm:text-6xl">
          {dictionary.discover.title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-white/52">
          {dictionary.discover.subtitle}
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-4 rounded-[1.7rem] border border-white/[0.07] bg-white/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={dictionary.discover.searchPlaceholder}
            className="h-12 w-full rounded-2xl border border-white/[0.08] bg-[#0e1310] pl-11 pr-4 text-sm font-semibold text-white outline-none placeholder:text-white/25 focus:border-[#b8f36b]/45"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-white/38">
          <span className="rounded-full bg-[#b8f36b]/10 px-3 py-1.5 font-bold text-[#cdfb94]">
            {filtered.length}
          </span>
          {dictionary.discover.publicDishes}
        </div>
      </div>

      <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((dish) => {
          const analysis = analyzeDish(dish.items, dish.goal, false);
          return (
            <article key={dish.id} className="surface group rounded-[2rem] p-5 transition hover:-translate-y-1 hover:border-white/15 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#b8f36b]">
                    {dictionary.goals[dish.goal]}
                  </p>
                  <h2 className="mt-2 text-balance text-xl font-black leading-7 text-white">
                    {dish.name}
                  </h2>
                  <p className="mt-2 text-sm text-white/36">{dish.author}</p>
                </div>
                <ScoreGauge score={analysis.overallScore} label={dictionary.common.score} size="small" />
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {dish.items.slice(0, 6).map((item) => {
                  const ingredient = ingredientById.get(item.ingredientId);
                  if (!ingredient) return null;
                  return (
                    <span key={item.ingredientId} className="rounded-full border border-white/[0.07] bg-white/[0.025] px-2.5 py-1 text-[11px] font-semibold text-white/48">
                      {ingredient.name[locale]}
                    </span>
                  );
                })}
              </div>

              <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-2xl bg-white/[0.03] p-3">
                  <strong className="block text-base tabular-nums text-white">{analysis.compatibilityScore}</strong>
                  <span className="mt-1 block text-white/32">{dictionary.builder.compatibility}</span>
                </div>
                <div className="rounded-2xl bg-white/[0.03] p-3">
                  <strong className="block text-base tabular-nums text-white">{dish.saves}</strong>
                  <span className="mt-1 block text-white/32">{dictionary.common.saves}</span>
                </div>
                <div className="rounded-2xl bg-white/[0.03] p-3">
                  <strong className="block text-base tabular-nums text-white">{dish.remixes}</strong>
                  <span className="mt-1 block text-white/32">{dictionary.common.remixes}</span>
                </div>
              </div>

              {dish.parentDishId && (
                <p className="mt-4 flex items-center gap-2 text-xs text-white/32">
                  <RemixIcon size={14} /> {dictionary.common.basedOn} #{dish.parentDishId.slice(0, 8)}
                </p>
              )}

              <button
                type="button"
                onClick={() => remix(dish)}
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#b8f36b] px-4 text-sm font-black text-[#0a0d0b] transition group-hover:bg-[#cdfb94]"
              >
                <RemixIcon size={17} />
                {dictionary.discover.openBuilder}
                <ArrowIcon size={16} />
              </button>
            </article>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="mt-8 rounded-[2rem] border border-dashed border-white/12 py-16 text-center text-white/40">
          {dictionary.common.noResults}
        </div>
      )}

      <div className="mt-9 flex items-center gap-3 rounded-2xl border border-[#b8f36b]/15 bg-[#b8f36b]/[0.045] px-4 py-4 text-sm leading-6 text-white/58">
        <RemixIcon className="shrink-0 text-[#b8f36b]" size={20} />
        {dictionary.discover.lineage}
      </div>
    </div>
  );
}
