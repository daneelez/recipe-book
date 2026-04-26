import { test as base } from "@playwright/test";
import { ProductFormPage } from "./page-objects/ProductFormPage";
import { DishFormPage } from "./page-objects/DishFormPage";
import { ProductListPage } from "./page-objects/ProductListPage";
import { DishListPage } from "./page-objects/DishListPage";
import { ProductCardPage } from "./page-objects/ProductCardPage";
import { DishCardPage } from "./page-objects/DishCardPage";

type UiFixtures = {
  productFormPage: ProductFormPage;
  dishFormPage: DishFormPage;
  productListPage: ProductListPage;
  dishListPage: DishListPage;
  productCardPage: ProductCardPage;
  dishCardPage: DishCardPage;
};

export const test = base.extend<UiFixtures>({
  productFormPage: async ({ page }, use) => {
    await use(new ProductFormPage(page));
  },
  dishFormPage: async ({ page }, use) => {
    await use(new DishFormPage(page));
  },
  productListPage: async ({ page }, use) => {
    await use(new ProductListPage(page));
  },
  dishListPage: async ({ page }, use) => {
    await use(new DishListPage(page));
  },
  productCardPage: async ({ page }, use) => {
    await use(new ProductCardPage(page));
  },
  dishCardPage: async ({ page }, use) => {
    await use(new DishCardPage(page));
  },
});

export { expect } from "@playwright/test";
