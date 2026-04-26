import type { Locator, Page } from '@playwright/test'
import { qaIds } from '../../../src/lib/qaSelectors'

export class ProductCardPage {
  readonly page: Page;
  readonly root: Locator;
  readonly title: Locator;
  readonly calories: Locator;
  readonly protein: Locator;
  readonly fat: Locator;
  readonly carbs: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.getByTestId(qaIds.productCard.root);
    this.title = page.getByTestId(qaIds.productCard.title);
    this.calories = page.getByTestId(qaIds.productCard.calories);
    this.protein = page.getByTestId(qaIds.productCard.protein);
    this.fat = page.getByTestId(qaIds.productCard.fat);
    this.carbs = page.getByTestId(qaIds.productCard.carbs);
  }
}
