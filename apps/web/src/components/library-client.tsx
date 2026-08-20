"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ingredientById } from "@flavorpilot/flavor-engine";
import { analyzeDish } from "@flavorpilot/flavor-engine";
import type { SavedDish } from "@flavorpilot/flavor-engine";
import type { Locale } from "../i18n/config";
import type { Dictionary } from "../i18n/dictionaries";
import {
  deleteSavedDish,
  readSavedDishes,
  setRemixPayload
} from "../lib/storage";
import { ArrowIcon, GlobeIcon, LinkIcon, LockIcon, RemixIcon, TrashIcon } from "./icons";

const iconByVisibility = {
  public: GlobeIcon,
  unlisted: LinkIcon,
  private: LockIcon
};

export function LibraryClient({
  locale,
  dictionary
}: {
  locale: Locale;
  dictionary: Dictionary;
}) {
  const router = useRouter();
  const [dishes, setDishes] = useState<SavedDish[]>([]);

  const refresh = () => setDishes(readSavedDishes());

  useEffect(() => {
    refresh();
    window.addEventListener("flavorpilot:dishes-updated", refresh);
    return () => window.removeEventListener("flavorpilot:dishes-updated", refresh);
  }, []);

  const openDish = (dish: SavedDish) => {
    setRemixPayload({
      name: dish.name,
      items: dish.items,
      goal: dish.goal,
      parentDishId: dish.parentDishId,
      dishId: dish.id,
      visibility: dish.visibility,
      createdAt: dish.createdAt
    });
    router.push(`/${locale}/builder`);
  };

  const remove = (id: string) => {
    deleteSavedDish(id);
    refresh();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-black tracking-[-0.045em] text-white sm:text-6xl">
          {dictionary.library.title}
        </h1>
        <p className="mt-4 text-lg leading-8 text-white/50">{dictionary.library.subtitle}</p>
      </div>

      <div className="mt-8 rounded-2xl border border-[#b8f36b]/15 bg-[#b8f36b]/[0.045] px-4 py-4 text-sm leading-6 text-white/56">
        {dictionary.library.localNotice}
      </div>

      {dishes.length === 0 ? (
        <div className="mt-8 rounded-[2rem] border border-dashed border-white/12 px-5 py-20 text-center">
          <h2 className="text-2xl font-black text-white">{dictionary.library.emptyTitle}</h2>
          <p className="mx-auto mt-3 max-w-md leading-7 text-white/42">{dictionary.library.emptyText}</p>
          <Link
            href={`/${locale}/builder`}
            className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-[#b8f36b] px-6 text-sm font-black text-[#0a0d0b]"
          >
            {dictionary.library.create}
            <ArrowIcon size={17} />
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {dishes.map((dish) => {
            const analysis = analyzeDish(dish.items, dish.goal, false);
            const VisibilityIcon = iconByVisibility[dish.visibility];
            const visibilityText =
              dish.visibility === "public"
                ? dictionary.common.public
                : dish.visibility === "unlisted"
                  ? dictionary.common.unlisted
                  : dictionary.common.private;
            return (
              <article key={dish.id} className="surface rounded-[2rem] p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white/42">
                      <VisibilityIcon size={12} /> {visibilityText}
                    </span>
                    <h2 className="mt-3 truncate text-xl font-black text-white">{dish.name}</h2>
                    <p className="mt-1 text-xs text-white/30">
                      {new Intl.DateTimeFormat(locale === "uk" ? "uk-UA" : "en-GB", {
                        dateStyle: "medium"
                      }).format(new Date(dish.createdAt))}
                    </p>
                  </div>
                  <strong className="rounded-2xl bg-[#b8f36b]/10 px-3 py-2 text-xl font-black tabular-nums text-[#cdfb94]">
                    {analysis.overallScore}
                  </strong>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {dish.items.slice(0, 6).map((item) => {
                    const ingredient = ingredientById.get(item.ingredientId);
                    return ingredient ? (
                      <span key={item.ingredientId} className="rounded-full bg-white/[0.035] px-2.5 py-1 text-[11px] font-semibold text-white/42">
                        {ingredient.name[locale]}
                      </span>
                    ) : null;
                  })}
                </div>

                {dish.parentDishId && (
                  <p className="mt-4 flex items-center gap-2 text-xs text-white/30">
                    <RemixIcon size={14} /> {dictionary.common.basedOn} #{dish.parentDishId.slice(0, 8)}
                  </p>
                )}

                <div className="mt-6 grid grid-cols-[1fr_44px] gap-2">
                  <button
                    type="button"
                    onClick={() => openDish(dish)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#b8f36b] text-sm font-black text-[#0a0d0b] transition hover:bg-[#cdfb94]"
                  >
                    {dictionary.library.open}
                    <ArrowIcon size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(dish.id)}
                    className="grid h-11 place-items-center rounded-2xl border border-white/[0.08] text-white/36 transition hover:border-[#ff8f7d]/25 hover:text-[#ff9f90]"
                    aria-label={dictionary.library.delete}
                  >
                    <TrashIcon size={17} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
