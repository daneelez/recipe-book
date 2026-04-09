import { describe, expect, it } from "vitest";
import { extractDishMacro } from "../macros.js";

describe("extractDishMacro", () => {
  it("Корректно отрабатывает с 1 макросом", () => {
    const r = extractDishMacro("Борщ !суп с мясом");
    expect(r.categoryFromMacro).toBe("SOUP");
    expect(r.cleanName).toContain("Борщ");
    expect(r.cleanName).not.toContain("!суп");
  });

  it("Игнорирует 2 макрос", () => {
    const r = extractDishMacro("!десерт !суп");
    expect(r.categoryFromMacro).toBe("DESSERT");
  });
});
