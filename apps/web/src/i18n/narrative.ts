import { ingredientById } from "@flavorpilot/flavor-engine";
import type { DishAnalysis, Locale } from "@flavorpilot/flavor-engine";
import type { Dictionary } from "./dictionaries";
import { formatIssue } from "./format";

export function buildDishNarrative(
  analysis: DishAnalysis,
  locale: Locale,
  dictionary: Dictionary
) {
  if (analysis.totalWeight === 0) {
    return {
      summary: dictionary.issues.emptyDish,
      nextMove: ""
    };
  }

  const leadingIssue = analysis.issues.find((issue) => issue.severity !== "info") ?? analysis.issues[0];
  const summary = leadingIssue
    ? formatIssue(leadingIssue, locale, dictionary)
    : dictionary.builder.noIssues;

  const top = analysis.recommendations[0];
  if (!top) return { summary, nextMove: "" };
  const ingredient = ingredientById.get(top.ingredientId)?.name[locale] ?? top.ingredientId;
  const change = `${top.balanceDelta >= 0 ? "+" : ""}${top.balanceDelta}`;

  const nextMove =
    locale === "uk"
      ? `${ingredient}, ${top.recommendedGrams} г: сумісність ${top.compatibility}%, корисність ${top.utility}%, прогноз зміни балансу ${change}.`
      : `${ingredient}, ${top.recommendedGrams} g: ${top.compatibility}% compatibility, ${top.utility}% utility, expected balance change ${change}.`;

  return { summary, nextMove };
}
