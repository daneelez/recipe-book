import { expect, test } from "./fixtures";
import { uniqueName } from "./support/testData";

test.describe("Системные тесты формы блюда", () => {
  test("Создание блюда с корректными данными", async ({ page, productFormPage, dishFormPage, dishListPage }) => {
    const ingredientName = uniqueName("ingredient");
    const dishName = uniqueName("valid-dish");
    await productFormPage.createProductViaUi({ name: ingredientName });
    await expect(page).toHaveURL(/\/products$/);

    await dishFormPage.createDishViaUi({ name: dishName, ingredientName });

    await expect(page).toHaveURL(/\/dishes$/);
    await dishListPage.searchByName(dishName);
    await expect(dishListPage.itemLinkByName(dishName)).toBeVisible();
  });

  test("Ошибка при названии длиной 1 символ", async ({ productFormPage, dishFormPage, page }) => {
    const ingredientName = uniqueName("ingredient");
    await productFormPage.createProductViaUi({ name: ingredientName });
    await expect(page).toHaveURL(/\/products$/);

    await dishFormPage.openNew();
    await dishFormPage.fillBaseDish("a ");
    await dishFormPage.selectIngredientByName(ingredientName);
    await dishFormPage.submit();

    await expect(dishFormPage.errorMessage).toContainText("Название не короче 2 символов");
  });

  const macroBoundaryCases = [
    { title: "Сохранение при БЖУ равном размеру порции", portion: 60, bju: [20, 20, 20], expectsError: false },
    { title: "Ошибка при БЖУ выше размера порции", portion: 60, bju: [20, 20, 20.1], expectsError: true },
  ] as const;

  for (const c of macroBoundaryCases) {
    test(c.title, async ({ page, productFormPage, dishFormPage, dishListPage }) => {
      const ingredientName = uniqueName("ingredient");
      const dishName = uniqueName("boundary-dish");
      await productFormPage.createProductViaUi({ name: ingredientName });
      await expect(page).toHaveURL(/\/products$/);

      await dishFormPage.openNew();
      await dishFormPage.fillBaseDish(dishName);
      await dishFormPage.selectIngredientByName(ingredientName);
      await dishFormPage.portionSizeInput.fill(String(c.portion));
      await dishFormPage.setBju(c.bju[0], c.bju[1], c.bju[2]);
      await dishFormPage.submit();

      if (c.expectsError) {
        await expect(dishFormPage.errorMessage).toContainText(
          "Нельзя сохранить: сумма Б+Ж+У на порцию не может превышать граммы порции."
        );
        await expect(page).toHaveURL(/\/dishes\/new$/);
      } else {
        await expect(page).toHaveURL(/\/dishes$/);
        await expect(dishListPage.itemLinkByName(dishName)).toBeVisible();
      }
    });
  }

  test("Удаление макроса из названия при сохранении", async ({ page, productFormPage, dishFormPage, dishListPage }) => {
    const ingredient = uniqueName("ingredient");
    await productFormPage.createProductViaUi({ name: ingredient });
    await expect(page).toHaveURL(/\/products$/);
    const rawName = `${uniqueName("salad")} !десерт`;

    await dishFormPage.createDishViaUi({ name: rawName, ingredientName: ingredient });
    await expect(page).toHaveURL(/\/dishes$/);

    await dishListPage.searchByName("salad");
    const savedNameLink = dishListPage.itemLinkByName("salad");
    await expect(savedNameLink).not.toContainText("!десерт");
  });

  test("Фильтрация блюд по поиску и категории", async ({ page, productFormPage, dishFormPage, dishListPage }) => {
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

    await dishListPage.open();
    await dishListPage.searchByName("сал");
    await expect(dishListPage.itemLinkByName(veganDish)).toBeVisible();
    await expect(dishListPage.itemLinkByName(nonVeganDish)).toHaveCount(0);

    await dishListPage.searchByName("");
    await dishListPage.categorySelect.selectOption("SOUP");
    await expect(dishListPage.itemLinkByName(nonVeganDish)).toBeVisible();
    await expect(dishListPage.itemLinkByName(veganDish)).toHaveCount(0);
  });

  test("Редактирование существующего блюда", async ({ page, productFormPage, dishFormPage, dishListPage, dishCardPage }) => {
    const ingredient = uniqueName("ingredient");
    const created = uniqueName("dish-old");
    const updatedName = uniqueName("dish-new");
    await productFormPage.createProductViaUi({ name: ingredient });
    await expect(page).toHaveURL(/\/products$/);
    await dishFormPage.createDishViaUi({ name: created, ingredientName: ingredient });
    await expect(page).toHaveURL(/\/dishes$/);

    await dishListPage.open();
    await dishListPage.searchByName(created);
    await dishListPage.openEditByName(created);
    await dishFormPage.nameInput.fill(updatedName);
    await dishFormPage.submit();
    await expect(page).toHaveURL(/\/dishes$/);
    await dishListPage.searchByName(updatedName);
    await expect(dishListPage.itemLinkByName(updatedName)).toBeVisible();
    await dishListPage.itemLinkByName(updatedName).click();
    await expect(dishCardPage.title).toContainText(updatedName);
  });

  test("Удаление существующего блюда", async ({ page, productFormPage, dishFormPage, dishListPage }) => {
    const ingredient = uniqueName("ingredient");
    const created = uniqueName("dish-delete");
    await productFormPage.createProductViaUi({ name: ingredient });
    await expect(page).toHaveURL(/\/products$/);
    await dishFormPage.createDishViaUi({ name: created, ingredientName: ingredient });
    await expect(page).toHaveURL(/\/dishes$/);

    await dishListPage.open();
    await dishListPage.searchByName(created);
    await dishListPage.openEditByName(created);
    await dishFormPage.deleteButton.click();
    await expect(page).toHaveURL(/\/dishes$/);
    await dishListPage.searchByName(created);
    await expect(dishListPage.itemLinkByName(created)).toHaveCount(0);
  });
});
