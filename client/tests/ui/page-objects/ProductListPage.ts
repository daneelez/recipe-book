import type { Locator, Page } from "@playwright/test";
import { qaSelectors } from "../support/selectors";

export class ProductListPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly createButton: Locator;
  readonly sortSelect: Locator;
  readonly orderSelect: Locator;
  readonly categorySelect: Locator;
  readonly veganCheckbox: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.locator(qaSelectors.productList.searchInput);
    this.createButton = page.locator(qaSelectors.productList.createButton);
    this.sortSelect = page.locator(qaSelectors.productList.sortSelect);
    this.orderSelect = page.locator(qaSelectors.productList.orderSelect);
    this.categorySelect = page.locator(qaSelectors.productList.categorySelect);
    this.veganCheckbox = page.locator(qaSelectors.productList.veganCheckbox);
  }

  async open(): Promise<void> {
    await this.page.goto("/products");
  }

  async searchByName(name: string): Promise<void> {
    await this.searchInput.fill(name);
  }

  rowByName(name: string): Locator {
    return this.page.locator("tr", { hasText: name }).first();
  }

  itemLinkByName(name: string): Locator {
    return this.page.locator(qaSelectors.productList.itemLink, { hasText: name }).first();
  }

  async openEditByName(name: string): Promise<void> {
    await this.rowByName(name).locator(qaSelectors.productList.editLink).click();
  }
}
