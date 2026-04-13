import { describe, expect, it } from 'vitest'
import { computePortionKbju } from '../kbju.js'
import { BASE, createIngredient, GRAMS, PRECISION, scale } from './config.js'

describe("utils/kbju/computePortionKbju", () => {
  /**
   * Один ингредиент
   */
  it.each([
    {
      title: "0 г",
      grams: GRAMS.ZERO,
    },
    {
      title: "малое значение",
      grams: GRAMS.SMALL,
    },
    {
      title: "очень малое значение",
      grams: GRAMS.VERY_SMALL,
    },
    {
      title: "ровно 100 г",
      grams: GRAMS.NORMAL,
    },
    {
      title: "дробное значение",
      grams: GRAMS.FRACTIONAL,
    },
    {
      title: "большое значение",
      grams: GRAMS.LARGE,
    },
  ])("$title", ({ grams }) => {
    const r = computePortionKbju([createIngredient(grams)]);

    expect(r.caloriesPerPortion).toBeCloseTo(scale(BASE.caloriesPer100g, grams), PRECISION);
    expect(r.proteinPerPortion).toBeCloseTo(scale(BASE.proteinPer100g, grams), PRECISION);
    expect(r.fatPerPortion).toBeCloseTo(scale(BASE.fatPer100g, grams), PRECISION);
    expect(r.carbsPerPortion).toBeCloseTo(scale(BASE.carbsPer100g, grams), PRECISION);
  });

  /**
   * Несколько ингредиентов
   */
  it.each([
    {
      title: "все ингредиенты 0 г",
      ingredients: [GRAMS.ZERO, GRAMS.ZERO, GRAMS.ZERO],
    },
    {
      title: "смешанный (0 + нормальный)",
      ingredients: [GRAMS.ZERO, GRAMS.NORMAL],
    },
    {
      title: "два дробных",
      ingredients: [12.5, 7.25],
    },
    {
      title: "много маленьких",
      ingredients: Array.from({ length: 100 }, () => 0.1),
    },
  ])("$title", ({ ingredients }) => {
    const rows = ingredients.map((g) => createIngredient(g));
    const r = computePortionKbju(rows);

    const expectedCalories = ingredients.reduce(
      (sum, g) => sum + scale(BASE.caloriesPer100g, g),
      0
    );

    const expectedProtein = ingredients.reduce(
      (sum, g) => sum + scale(BASE.proteinPer100g, g),
      0
    );

    const expectedCarbs = ingredients.reduce((sum, g) => sum + scale(BASE.carbsPer100g, g), 0);

    const expectedFat = ingredients.reduce((sum, g) => sum + scale(BASE.fatPer100g, g), 0);

    expect(r.caloriesPerPortion).toBeCloseTo(expectedCalories, PRECISION);
    expect(r.proteinPerPortion).toBeCloseTo(expectedProtein, PRECISION);
    expect(r.carbsPerPortion).toBeCloseTo(expectedCarbs, PRECISION);
    expect(r.fatPerPortion).toBeCloseTo(expectedFat, PRECISION);
  });

  /**
   * Разные пропорции БЖУ
   */
  it("разные белки", () => {
    const r = computePortionKbju([
      createIngredient(GRAMS.NORMAL, { proteinPer100g: 11 }),
      createIngredient(GRAMS.NORMAL, { proteinPer100g: 50 }),
    ]);

    const expectedProtein= scale(11, GRAMS.NORMAL) + scale(50, GRAMS.NORMAL)

    expect(r.proteinPerPortion).toBeCloseTo(expectedProtein, PRECISION);
  });

  it("все БЖУ 0", () => {
    const r = computePortionKbju([
      createIngredient(GRAMS.NORMAL, {
        caloriesPer100g: 0,
        proteinPer100g: 0,
        fatPer100g: 0,
        carbsPer100g: 0,
      }),
    ]);

    expect(r).toEqual({
      caloriesPerPortion: 0,
      proteinPerPortion: 0,
      fatPerPortion: 0,
      carbsPerPortion: 0,
    });
  });

  /**
   * Округление
   */
  it("округление до 2 знаков", () => {
    const grams = 33.3333
    const digits = 2

    const r = computePortionKbju([createIngredient(grams)]);

    const rounded = Number(r.caloriesPerPortion.toFixed(digits));
    const expected = Number(scale(BASE.caloriesPer100g, grams).toFixed(digits));

    expect(rounded).toBeCloseTo(expected, digits);
  });

  /**
   * Корнер кейсы
   */
  it("Корректно пропускает отрицательные граммы", () => {
    const ingredients = [-GRAMS.NORMAL, GRAMS.NORMAL];
    const r = computePortionKbju(ingredients.map((g) => createIngredient(g)));

    const expected = Number(scale(BASE.caloriesPer100g, GRAMS.NORMAL).toFixed(PRECISION));

    expect(r.caloriesPerPortion).toBeCloseTo(expected);
  });

  /**
   * Без данных
   */
  it("пустой массив", () => {
    const r = computePortionKbju([]);

    expect(r).toEqual({
      caloriesPerPortion: 0,
      proteinPerPortion: 0,
      fatPerPortion: 0,
      carbsPerPortion: 0,
    });
  });
});

