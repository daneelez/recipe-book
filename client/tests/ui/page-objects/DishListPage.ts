import type { Locator, Page } from "@playwright/test";
import { qaSelectors } from "../support/selectors";

export class DishListPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly categorySelect: Locator;
  readonly createButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.locator(qaSelectors.dishList.searchInput);
    this.categorySelect = page.locator(qaSelectors.dishList.categorySelect);
    this.createButton = page.locator(qaSelectors.dishList.createButton);
  }

  async open(): Promise<void> {
    await this.page.goto("/dishes");
  }

  async searchByName(name: string): Promise<void> {
    await this.searchInput.fill(name);
  }

  rowByName(name: string): Locator {
    return this.page.locator("tr", { hasText: name }).first();
  }

  itemLinkByName(name: string): Locator {
    return this.page.locator(qaSelectors.dishList.itemLink, { hasText: name }).first();
  }

  async openEditByName(name: string): Promise<void> {
    await this.rowByName(name).locator(qaSelectors.dishList.editLink).click();
  }
}
