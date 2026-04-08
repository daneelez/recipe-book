import { describe, expect, it } from "vitest";
import { assertProductBjuSum } from "../validation.js";

describe("lib/validation/assertProductBjuSum", () => {
  it("выбрасывает ошибку если сумма БЖУ на 100 г превышает 100 г", () => {
    expect(() => assertProductBjuSum({ proteinPer100g: 50, fatPer100g: 50, carbsPer100g: 50 })).toThrow("Сумма белков, жиров и углеводов на 100 г не может превышать 100 г.");
  });
  it("не выбрасывает ошибку если сумма БЖУ на 100 г меньше 100 г", () => {
    expect(() => assertProductBjuSum({ proteinPer100g: 50, fatPer100g: 50, carbsPer100g: 0 })).not.toThrow();
  });
});