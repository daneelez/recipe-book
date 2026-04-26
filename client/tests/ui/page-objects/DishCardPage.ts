import type { Locator, Page } from "@playwright/test";
import { qaIds } from "../../../src/lib/qaSelectors";

export class DishCardPage {
  readonly page: Page;
  readonly title: Locator;
  readonly calories: Locator;
  readonly protein: Locator;
  readonly fat: Locator;
  readonly carbs: Locator;
  readonly portionSize: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.getByTestId(qaIds.dishCard.title);
    this.calories = page.getByTestId(qaIds.dishCard.calories);
    this.protein = page.getByTestId(qaIds.dishCard.protein);
    this.fat = page.getByTestId(qaIds.dishCard.fat);
    this.carbs = page.getByTestId(qaIds.dishCard.carbs);
    this.portionSize = page.getByTestId(qaIds.dishCard.portionSize);
  }
}
