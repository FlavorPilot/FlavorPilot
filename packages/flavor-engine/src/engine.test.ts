import { describe, expect, it } from "vitest";
import { defaultDish, ingredientById } from "./ingredients";
import { analyzeDish, calculatePair } from "./engine";

const prepared = (id: string) => {
  const ingredient = ingredientById.get(id);
  if (!ingredient) throw new Error(`Missing ingredient: ${id}`);
  return {
    ingredient,
    profile: ingredient.profile,
    intensity: ingredient.intensity,
    aromas: ingredient.aromas,
    textures: ingredient.textures
  };
};

describe("Flavor Engine", () => {
  it("scores a classic duck and cherry pairing above duck and cucumber", () => {
    expect(calculatePair(prepared("duck"), prepared("cherry")).score).toBeGreaterThan(
      calculatePair(prepared("duck"), prepared("cucumber")).score
    );
  });

  it("detects that a fatty salmon composition needs acidity", () => {
    const analysis = analyzeDish(
      [
        { ingredientId: "salmon", grams: 180, preparationId: "raw" },
        { ingredientId: "avocado", grams: 90, preparationId: "raw" },
        { ingredientId: "mayonnaise", grams: 55, preparationId: "sauce" }
      ],
      "balanced"
    );

    expect(analysis.issues.some((issue) => issue.code === "fatNeedsAcid")).toBe(true);
    expect(
      analysis.recommendations.slice(0, 8).some((item) =>
        ["lime", "lemon", "rice_vinegar"].includes(item.ingredientId)
      )
    ).toBe(true);
  });

  it("improves balance when lime is added to a fatty dish", () => {
    const base = [
      { ingredientId: "salmon", grams: 180, preparationId: "raw" },
      { ingredientId: "avocado", grams: 90, preparationId: "raw" },
      { ingredientId: "mayonnaise", grams: 45, preparationId: "sauce" }
    ];

    const before = analyzeDish(base, "balanced", false);
    const after = analyzeDish(
      [...base, { ingredientId: "lime", grams: 14, preparationId: "raw" }],
      "balanced",
      false
    );

    expect(after.balanceScore).toBeGreaterThan(before.balanceScore);
  });

  it("penalizes an excessive amount of rosemary", () => {
    const normal = analyzeDish(
      [
        { ingredientId: "duck", grams: 220, preparationId: "seared" },
        { ingredientId: "cherry", grams: 70, preparationId: "sauce" },
        { ingredientId: "rosemary", grams: 1.2, preparationId: "roasted" }
      ],
      "rich",
      false
    );
    const excessive = analyzeDish(
      [
        { ingredientId: "duck", grams: 220, preparationId: "seared" },
        { ingredientId: "cherry", grams: 70, preparationId: "sauce" },
        { ingredientId: "rosemary", grams: 35, preparationId: "roasted" }
      ],
      "rich",
      false
    );

    expect(excessive.quantityScore).toBeLessThan(normal.quantityScore);
    expect(excessive.issues.some((issue) => issue.code === "dominantIngredient")).toBe(true);
  });

  it("returns a meaningful analysis for the default dish", () => {
    const analysis = analyzeDish(defaultDish, "fresh");
    expect(analysis.overallScore).toBeGreaterThan(55);
    expect(analysis.pairResults.length).toBe(6);
    expect(analysis.recommendations.length).toBeGreaterThan(0);
  });
});
