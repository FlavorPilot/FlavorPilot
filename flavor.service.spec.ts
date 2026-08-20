import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { FlavorService } from "./flavor.service";

describe("FlavorService", () => {
  it("uses the shared deterministic engine", () => {
    const result = new FlavorService().analyze({
      goal: "fresh",
      includeRecommendations: true,
      items: [
        { ingredientId: "salmon", grams: 180, preparationId: "raw" },
        { ingredientId: "avocado", grams: 80, preparationId: "raw" },
        { ingredientId: "lime", grams: 12, preparationId: "raw" }
      ]
    });
    expect(result.overallScore).toBeGreaterThan(50);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it("rejects unknown catalog references before analysis", () => {
    expect(() =>
      new FlavorService().analyze({
        goal: "balanced",
        includeRecommendations: false,
        items: [{ ingredientId: "invented_food", grams: 50, preparationId: "raw" }]
      })
    ).toThrow(BadRequestException);
  });
});
