import { expect, test } from "./fixtures";
import { qaSelectors } from "./support/selectors";
import { uniqueName } from "./support/testData";

test.describe("Product form UI system tests", () => {
  /**
   * Equivalence partitioning:
   * - valid name class (length >= 2) should create a product
   */
  test("creates product for valid equivalence class", async ({ page, productFormPage }) => {
    const productName = uniqueName("valid-product");

    await productFormPage.openNew();
    await productFormPage.fillBaseProduct(productName);
    await productFormPage.setBju(20, 30, 40);
    await productFormPage.submit();

    await expect(page).toHaveURL(/\/products$/);
    await page.locator(qaSelectors.productList.searchInput).fill(productName);
    await expect(page.locator(qaSelectors.productList.itemLink, { hasText: productName })).toBeVisible();
  });

  /**
   * Boundary value analysis for product name:
   * - 1 char: invalid
   * - 2 chars: valid boundary
   */
  test.describe("name boundaries", () => {
    test("rejects name with length 1", async ({ productFormPage }) => {
      await productFormPage.openNew();
      await productFormPage.fillBaseProduct("a");
      await productFormPage.setBju(10, 10, 10);
      await productFormPage.submit();

      await expect(productFormPage.errorMessage).toContainText("Название не короче 2 символов");
    });

    test("accepts name with length 2", async ({ page, productFormPage }) => {
      const name = `${uniqueName("n")}-ab`;

      await productFormPage.openNew();
      await productFormPage.fillBaseProduct(name);
      await productFormPage.setBju(10, 10, 10);
      await productFormPage.submit();

      await expect(page).toHaveURL(/\/products$/);
      await expect(page.locator(qaSelectors.productList.itemLink, { hasText: name })).toBeVisible();
    });
  });

  /**
   * Boundary + equivalence for BJU sum:
   * - <= 100: valid class
   * - > 100: invalid class
   */
  test.describe("BJU sum boundaries", () => {
    const cases = [
      { title: "accepts sum equal 100", bju: [40, 30, 30], expectsError: false },
      { title: "rejects sum above 100", bju: [40, 30, 30.1], expectsError: true },
    ] as const;

    for (const c of cases) {
      test(c.title, async ({ page, productFormPage }) => {
        const productName = uniqueName("bju");

        await productFormPage.openNew();
        await productFormPage.fillBaseProduct(productName);
        await productFormPage.setBju(c.bju[0], c.bju[1], c.bju[2]);
        await productFormPage.submit();

        if (c.expectsError) {
          await expect(productFormPage.errorMessage).toContainText("Сумма БЖУ на 100 г не может превышать 100 г.");
          await expect(page).toHaveURL(/\/products\/new$/);
        } else {
          await expect(page).toHaveURL(/\/products$/);
          await expect(page.locator(qaSelectors.productList.itemLink, { hasText: productName })).toBeVisible();
        }
      });
    }
  });

  /**
   * Equivalence partitioning for list filters and sorting:
   * - include/exclude by search, category, flags
   * - ordering by calories descending
   */
  test("filters and sorts products in list", async ({ page, productFormPage }) => {
    const apple = uniqueName("яблоко");
    const meat = uniqueName("говядина");

    await productFormPage.createProductViaUi({ name: apple, protein: 5, fat: 5, carbs: 5 });
    await expect(page).toHaveURL(/\/products$/);
    await productFormPage.createProductViaUi({ name: meat, protein: 30, fat: 30, carbs: 30 });
    await expect(page).toHaveURL(/\/products$/);

    await page.goto("/products");
    await page.locator(qaSelectors.productList.searchInput).fill("ябл");
    await expect(page.locator(qaSelectors.productList.itemLink, { hasText: apple })).toBeVisible();
    await expect(page.locator(qaSelectors.productList.itemLink, { hasText: meat })).toHaveCount(0);

    await page.locator(qaSelectors.productList.searchInput).fill("");
    await page.locator(qaSelectors.productList.sortSelect).selectOption("calories");
    await page.locator(qaSelectors.productList.orderSelect).selectOption("desc");
    const firstRowLink = page.locator(qaSelectors.productList.itemLink).first();
    await expect(firstRowLink).toContainText(meat);
  });

  test("updates existing product", async ({ page, productFormPage }) => {
    const initial = uniqueName("product-update-old");
    const updatedName = uniqueName("product-update-new");
    await productFormPage.createProductViaUi({ name: initial });
    await expect(page).toHaveURL(/\/products$/);

    await page.goto("/products");
    await page.locator(qaSelectors.productList.searchInput).fill(initial);
    const row = page.locator("tr", { hasText: initial }).first();
    await row.locator(qaSelectors.productList.editLink).click();
    await productFormPage.nameInput.fill(updatedName);
    await productFormPage.submit();
    await expect(page).toHaveURL(/\/products$/);

    await page.locator(qaSelectors.productList.searchInput).fill(updatedName);
    await expect(page.locator(qaSelectors.productList.itemLink, { hasText: updatedName })).toBeVisible();
  });

  test("deletes existing product", async ({ page, productFormPage }) => {
    const initial = uniqueName("product-delete");
    await productFormPage.createProductViaUi({ name: initial });
    await expect(page).toHaveURL(/\/products$/);

    await page.goto("/products");
    await page.locator(qaSelectors.productList.searchInput).fill(initial);
    const row = page.locator("tr", { hasText: initial }).first();
    await row.locator(qaSelectors.productList.editLink).click();
    await productFormPage.deleteButton.click();
    await expect(page).toHaveURL(/\/products$/);
    await page.locator(qaSelectors.productList.searchInput).fill(initial);
    await expect(page.locator(qaSelectors.productList.itemLink, { hasText: initial })).toHaveCount(0);
  });

  test("shows deletion conflict when product is used in dish", async ({ page, productFormPage, dishFormPage }) => {
    const product = uniqueName("product-in-dish");
    const dishName = uniqueName("dish-for-conflict");
    await productFormPage.createProductViaUi({ name: product });
    await expect(page).toHaveURL(/\/products$/);
    await dishFormPage.createDishViaUi({ name: dishName, ingredientName: product });
    await expect(page).toHaveURL(/\/dishes$/);

    await page.goto("/products");
    await page.locator(qaSelectors.productList.searchInput).fill(product);
    const row = page.locator("tr", { hasText: product }).first();
    await row.locator(qaSelectors.productList.editLink).click();
    await productFormPage.deleteButton.click();

    await expect(productFormPage.deleteErrorMessage).toContainText("Нельзя удалить продукт: он используется в блюдах");
    await expect(page.getByRole("link", { name: dishName })).toBeVisible();
  });
});
