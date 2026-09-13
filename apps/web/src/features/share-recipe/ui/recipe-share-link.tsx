"use client";
import { useEffect, useState } from "react";
import type { Recipe } from "@/entities/dish";
import { getDictionary, type Locale } from "@/shared/i18n";
import { Button, Icon } from "@/shared/ui";
export function RecipeShareLink({ recipe, locale }: {
    recipe: Recipe;
    locale: Locale;
}) {
    const t = getDictionary(locale).messages;
    const [url, setUrl] = useState("");
    const [status, setStatus] = useState<"idle" | "copied" | "manual">("idle");
    useEffect(() => {
        setStatus("idle");
        const route = recipe.origin !== "cloud" ? null
            : recipe.visibility === "public" ? `/${locale}/dishes/${encodeURIComponent(recipe.id)}`
                : recipe.visibility === "unlisted" && recipe.shareToken ? `/${locale}/share/${encodeURIComponent(recipe.shareToken)}` : null;
        setUrl(route ? new URL(route, window.location.origin).toString() : "");
    }, [recipe.id, recipe.origin, recipe.visibility, recipe.shareToken, locale]);
    async function copy() {
        try {
            await navigator.clipboard.writeText(url);
            setStatus("copied");
        }
        catch {
            setStatus("manual");
        }
    }
    if (!url)
        return null;
    return <div className="saved-recipe-link">
    <label className="field-label">{t.savedLink}<input readOnly value={url} onFocus={event => event.target.select()}/></label>
    <Button onClick={() => void copy()}><Icon name="link" size={16}/>{status === "copied" ? t.linkCopied : t.copyLink}</Button>
    <p className="small muted" role="status">{status === "manual" ? t.copyManually : recipe.visibility === "unlisted" ? t.unlistedHint : t.publicHint}</p>
  </div>;
}
