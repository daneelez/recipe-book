import { describe, expect, it } from "vitest";
import { computePortionKbju, type IngredientRow } from "../kbju.js";

/**
 * Test design notes (explicitly per task requirements):
 *
 * - Equivalence Partitioning:
 *   - EP1: empty ingredient list
 *   - EP2: single ingredient, integer grams
 *   - EP3: multiple ingredients
 *   - EP4: decimal grams / decimal per-100g values (typical real-world data)
 *
 * - Boundary Value Analysis:
 *   - BVA1: grams = 0 (lower boundary of contribution)
 *   - BVA2: grams just above 0 (0.01)
 *   - BVA3: grams = 100 (exactly one "per 100g" unit)
 *   - BVA4: grams = 200 (multiple of 100)
 *
 * We assert using toBeCloseTo to avoid float rounding artifacts.
 */

describe("utils/kbju.computePortionKbju", () => {
  it("EP1: returns zeros for empty ingredient list", () => {
    const r = computePortionKbju([]);
    expect(r).toEqual({
      caloriesPerPortion: 0,
      proteinPerPortion: 0,
      fatPerPortion: 0,
      carbsPerPortion: 0,
    });
  });

  it.each([
    {
      title: "BVA1: grams=0 should contribute nothing",
      ingredients: [{ caloriesPer100g: 100, proteinPer100g: 10, fatPer100g: 5, carbsPer100g: 20, grams: 0 }],
      expected: { caloriesPerPortion: 0, proteinPerPortion: 0, fatPerPortion: 0, carbsPerPortion: 0 },
    },
    {
      title: "BVA3: grams=100 equals per-100g values (EP2)",
      ingredients: [{ caloriesPer100g: 123, proteinPer100g: 4, fatPer100g: 5.5, carbsPer100g: 20, grams: 100 }],
      expected: { caloriesPerPortion: 123, proteinPerPortion: 4, fatPerPortion: 5.5, carbsPerPortion: 20 },
    },
    {
      title: "BVA4: grams=200 doubles per-100g values (EP2)",
      ingredients: [{ caloriesPer100g: 50, proteinPer100g: 1, fatPer100g: 2, carbsPer100g: 3, grams: 200 }],
      expected: { caloriesPerPortion: 100, proteinPerPortion: 2, fatPerPortion: 4, carbsPerPortion: 6 },
    },
    {
      title: "BVA2+EP4: decimal grams should scale proportionally",
      ingredients: [{ caloriesPer100g: 80, proteinPer100g: 6.25, fatPer100g: 0.1, carbsPer100g: 12.5, grams: 0.01 }],
      expected: {
        caloriesPerPortion: 0.008,
        proteinPerPortion: 0.000625,
        fatPerPortion: 0.00001,
        carbsPerPortion: 0.00125,
      },
    },
  ] satisfies Array<{
    title: string;
    ingredients: IngredientRow[];
    expected: { caloriesPerPortion: number; proteinPerPortion: number; fatPerPortion: number; carbsPerPortion: number };
  }>)("$title", ({ ingredients, expected }) => {
    const r = computePortionKbju(ingredients);
    expect(r.caloriesPerPortion).toBeCloseTo(expected.caloriesPerPortion, 10);
    expect(r.proteinPerPortion).toBeCloseTo(expected.proteinPerPortion, 10);
    expect(r.fatPerPortion).toBeCloseTo(expected.fatPerPortion, 10);
    expect(r.carbsPerPortion).toBeCloseTo(expected.carbsPerPortion, 10);
  });

  it("EP3: sums multiple ingredients (order-independent)", () => {
    const a: IngredientRow = { caloriesPer100g: 100, proteinPer100g: 10, fatPer100g: 5, carbsPer100g: 20, grams: 50 };
    const b: IngredientRow = { caloriesPer100g: 200, proteinPer100g: 0, fatPer100g: 1.5, carbsPer100g: 0, grams: 25 };

    const r1 = computePortionKbju([a, b]);
    const r2 = computePortionKbju([b, a]);

    // expected:
    // a contributes 0.5x, b contributes 0.25x
    expect(r1.caloriesPerPortion).toBeCloseTo(100 * 0.5 + 200 * 0.25, 10);
    expect(r1.proteinPerPortion).toBeCloseTo(10 * 0.5 + 0 * 0.25, 10);
    expect(r1.fatPerPortion).toBeCloseTo(5 * 0.5 + 1.5 * 0.25, 10);
    expect(r1.carbsPerPortion).toBeCloseTo(20 * 0.5 + 0 * 0.25, 10);

    expect(r2).toEqual(r1);
  });
});

