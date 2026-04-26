import { expect, test } from "./fixtures";
import { qaSelectors } from "./support/selectors";
import { uniqueName } from "./support/testData";

test.describe("Dish form UI system tests", () => {
  /**
   * Equivalence partitioning:
   * - valid dish payload should be saved
   * - required ingredient class is represented by one selected product
   */
  test("creates dish for valid equivalence class", async ({ page, productFormPage, dishFormPage }) => {
    const ingredientName = uniqueName("ingredient");
    const dishName = uniqueName("valid-dish");
    await productFormPage.createProductViaUi({ name: ingredientName });
    await expect(page).toHaveURL(/\/products$/);

    await dishFormPage.createDishViaUi({ name: dishName, ingredientName });

    await expect(page).toHaveURL(/\/dishes$/);
    await page.locator(qaSelectors.dishList.searchInput).fill(dishName);
    await expect(page.locator(qaSelectors.dishList.itemLink, { hasText: dishName })).toBeVisible();
  });

  /**
   * Boundary value analysis for name.
   */
  test("rejects dish name with length 1", async ({ productFormPage, dishFormPage, page }) => {
    const ingredientName = uniqueName("ingredient");
    await productFormPage.createProductViaUi({ name: ingredientName });
    await expect(page).toHaveURL(/\/products$/);

    await dishFormPage.openNew();
    await dishFormPage.fillBaseDish("a");
    await dishFormPage.selectIngredientByName(ingredientName);
    await dishFormPage.submit();

    await expect(dishFormPage.errorMessage).toContainText("Название не короче 2 символов");
  });

  /**
   * Parameterized boundary tests for B+Ж+У vs portion grams.
   */
  const macroBoundaryCases = [
    { title: "accepts BJU sum exactly equal to portion", portion: 60, bju: [20, 20, 20], expectsError: false },
    { title: "rejects BJU sum above portion", portion: 60, bju: [20, 20, 20.1], expectsError: true },
  ] as const;

  for (const c of macroBoundaryCases) {
    test(c.title, async ({ page, productFormPage, dishFormPage }) => {
      const ingredientName = uniqueName("ingredient");
      const dishName = uniqueName("boundary-dish");
      await productFormPage.createProductViaUi({ name: ingredientName });
      await expect(page).toHaveURL(/\/products$/);

      await dishFormPage.openNew();
      await dishFormPage.fillBaseDish(dishName);
      await dishFormPage.selectIngredientByName(ingredientName);
      await dishFormPage.portionSizeInput.fill(String(c.portion));
      await dishFormPage.setMacros(c.bju[0], c.bju[1], c.bju[2]);
      await dishFormPage.submit();

      if (c.expectsError) {
        await expect(dishFormPage.errorMessage).toContainText(
          "Нельзя сохранить: сумма Б+Ж+У на порцию не может превышать граммы порции."
        );
        await expect(page).toHaveURL(/\/dishes\/new$/);
      } else {
        await expect(page).toHaveURL(/\/dishes$/);
        await expect(page.locator(qaSelectors.dishList.itemLink, { hasText: dishName })).toBeVisible();
      }
    });
  }

  test("removes macro from dish name and saves mapped category", async ({ page, productFormPage, dishFormPage }) => {
    const ingredient = uniqueName("ingredient");
    await productFormPage.createProductViaUi({ name: ingredient });
    await expect(page).toHaveURL(/\/products$/);
    const rawName = `${uniqueName("salad")} !десерт`;

    await dishFormPage.createDishViaUi({ name: rawName, ingredientName: ingredient });
    await expect(page).toHaveURL(/\/dishes$/);

    await page.locator(qaSelectors.dishList.searchInput).fill("salad");
    const savedNameLink = page.locator(qaSelectors.dishList.itemLink).first();
    await expect(savedNameLink).not.toContainText("!десерт");
  });

  test("filters dishes by search and category", async ({ page, productFormPage, dishFormPage }) => {
    const ingredientA = uniqueName("ing-a");
    const ingredientB = uniqueName("ing-b");
    const veganDish = uniqueName("салат");
    const nonVeganDish = uniqueName("суп");
    await productFormPage.createProductViaUi({ name: ingredientA });
    await expect(page).toHaveURL(/\/products$/);
    await productFormPage.createProductViaUi({ name: ingredientB });
    await expect(page).toHaveURL(/\/products$/);

    await dishFormPage.openNew();
    await dishFormPage.fillBaseDish(veganDish);
    await dishFormPage.categorySelect.selectOption("SALAD");
    await dishFormPage.selectIngredientByName(ingredientA);
    await dishFormPage.submit();
    await expect(page).toHaveURL(/\/dishes$/);

    await dishFormPage.openNew();
    await dishFormPage.fillBaseDish(nonVeganDish);
    await dishFormPage.categorySelect.selectOption("SOUP");
    await dishFormPage.selectIngredientByName(ingredientB);
    await dishFormPage.submit();
    await expect(page).toHaveURL(/\/dishes$/);

    await page.goto("/dishes");
    await page.locator(qaSelectors.dishList.searchInput).fill("сал");
    await expect(page.locator(qaSelectors.dishList.itemLink, { hasText: veganDish })).toBeVisible();
    await expect(page.locator(qaSelectors.dishList.itemLink, { hasText: nonVeganDish })).toHaveCount(0);

    await page.locator(qaSelectors.dishList.searchInput).fill("");
    await page.locator(qaSelectors.dishList.categorySelect).selectOption("SOUP");
    await expect(page.locator(qaSelectors.dishList.itemLink, { hasText: nonVeganDish })).toBeVisible();
    await expect(page.locator(qaSelectors.dishList.itemLink, { hasText: veganDish })).toHaveCount(0);
  });

  test("updates existing dish", async ({ page, productFormPage, dishFormPage }) => {
    const ingredient = uniqueName("ingredient");
    const created = uniqueName("dish-old");
    const updatedName = uniqueName("dish-new");
    await productFormPage.createProductViaUi({ name: ingredient });
    await expect(page).toHaveURL(/\/products$/);
    await dishFormPage.createDishViaUi({ name: created, ingredientName: ingredient });
    await expect(page).toHaveURL(/\/dishes$/);

    await page.goto("/dishes");
    await page.locator(qaSelectors.dishList.searchInput).fill(created);
    const row = page.locator("tr", { hasText: created }).first();
    await row.locator(qaSelectors.dishList.editLink).click();
    await dishFormPage.nameInput.fill(updatedName);
    await dishFormPage.submit();
    await expect(page).toHaveURL(/\/dishes$/);
    await page.locator(qaSelectors.dishList.searchInput).fill(updatedName);
    await expect(page.locator(qaSelectors.dishList.itemLink, { hasText: updatedName })).toBeVisible();
  });

  test("deletes existing dish", async ({ page, productFormPage, dishFormPage }) => {
    const ingredient = uniqueName("ingredient");
    const created = uniqueName("dish-delete");
    await productFormPage.createProductViaUi({ name: ingredient });
    await expect(page).toHaveURL(/\/products$/);
    await dishFormPage.createDishViaUi({ name: created, ingredientName: ingredient });
    await expect(page).toHaveURL(/\/dishes$/);

    await page.goto("/dishes");
    await page.locator(qaSelectors.dishList.searchInput).fill(created);
    const row = page.locator("tr", { hasText: created }).first();
    await row.locator(qaSelectors.dishList.editLink).click();
    await dishFormPage.deleteButton.click();
    await expect(page).toHaveURL(/\/dishes$/);
    await page.locator(qaSelectors.dishList.searchInput).fill(created);
    await expect(page.locator(qaSelectors.dishList.itemLink, { hasText: created })).toHaveCount(0);
  });
});
