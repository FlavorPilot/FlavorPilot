import { ingredientById } from "@tastecraft/flavor-engine";
import type { DishIssue, Locale } from "@tastecraft/flavor-engine";
import type { Dictionary } from "./dictionaries";

export const formatIssue = (
  issue: DishIssue,
  locale: Locale,
  dictionary: Dictionary
) => {
  const template = dictionary.issues[issue.code];
  const ingredient = issue.ingredientId
    ? ingredientById.get(issue.ingredientId)?.name[locale] ?? issue.ingredientId
    : "";
  return template.replace("{ingredient}", ingredient);
};
