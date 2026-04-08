import { describe, expect, it } from "vitest";
import { extractDishMacro } from "./macros.js";

describe("extractDishMacro", () => {
  it("maps first macro and strips from name", () => {
    const r = extractDishMacro("Борщ !суп с мясом");
    expect(r.categoryFromMacro).toBe("SOUP");
    expect(r.cleanName).toContain("Борщ");
    expect(r.cleanName).not.toContain("!суп");
  });

  it("ignores second macro", () => {
    const r = extractDishMacro("!десерт !суп");
    expect(r.categoryFromMacro).toBe("DESSERT");
  });
});
