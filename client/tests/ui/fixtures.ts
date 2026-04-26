import { test as base } from "@playwright/test";
import { ProductFormPage } from "./page-objects/ProductFormPage";
import { DishFormPage } from "./page-objects/DishFormPage";

type UiFixtures = {
  productFormPage: ProductFormPage;
  dishFormPage: DishFormPage;
};

export const test = base.extend<UiFixtures>({
  productFormPage: async ({ page }, use) => {
    await use(new ProductFormPage(page));
  },
  dishFormPage: async ({ page }, use) => {
    await use(new DishFormPage(page));
  },
});

export { expect } from "@playwright/test";
