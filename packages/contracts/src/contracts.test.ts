import { describe, expect, it } from "vitest";
import {
  analyzeDishRequestSchema,
  createDishRequestSchema,
  publicDishListQuerySchema,
  savedDishSchema,
  updateDishRequestSchema
} from "./index";

describe("FlavorPilot contracts", () => {
  it("normalizes defaults for flavor analysis", () => {
    const value = analyzeDishRequestSchema.parse({
      items: [{ ingredientId: "salmon", grams: 180, preparationId: "raw" }]
    });
    expect(value.goal).toBe("balanced");
    expect(value.includeRecommendations).toBe(true);
  });

  it("rejects empty persisted dishes", () => {
    expect(() =>
      createDishRequestSchema.parse({ name: "Empty", items: [] })
    ).toThrow();
  });

  it("keeps remix lineage immutable after creation", () => {
    expect(() =>
      updateDishRequestSchema.parse({
        parentDishId: "9a111111-1111-4111-8111-111111111111"
      })
    ).toThrow();
  });

  it("does not inject create defaults into partial updates", () => {
    expect(updateDishRequestSchema.parse({ name: "Renamed" })).toEqual({
      name: "Renamed"
    });
  });


  it("rejects malformed anonymous browser dishes", () => {
    expect(() =>
      savedDishSchema.parse({
        id: "local-1",
        name: "Broken",
        items: [{ ingredientId: "salmon", grams: -1, preparationId: "raw" }],
        goal: "fresh",
        visibility: "private",
        createdAt: "not-a-date"
      })
    ).toThrow();
  });

  it("coerces public-list limits from query strings", () => {
    expect(publicDishListQuerySchema.parse({ limit: "12" }).limit).toBe(12);
  });
});
