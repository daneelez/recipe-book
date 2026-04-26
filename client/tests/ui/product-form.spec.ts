import { expect, test } from './fixtures'
import { uniqueName } from './support/testData'

test.describe("Системные тесты формы продукта", () => {
  test("Создание продукта с корректными данными", async ({
                                                           page,
                                                           productFormPage,
                                                           productListPage,
                                                           productCardPage,
                                                         }) => {
    const productName = uniqueName("продукт");

    await productFormPage.createProductViaUi({
      name: productName,
      calories: 120,
      protein: 20,
      fat: 30,
      carbs: 40,
      category: "VEGETABLES",
      cooking: "READY_TO_EAT",
    });

    await expect(page).toHaveURL(/\/products$/);

    await productListPage.open();
    await productListPage.searchByName(productName);
    const row = productListPage.rowByName(productName);
    await expect(row).toBeVisible();

    await productListPage.itemLinkByName(productName).click();

    await expect(page).toHaveURL(/\/\/products\/.*\/view|\/products\/.*\/view/);
    await expect(productCardPage.title).toContainText(productName);
    await expect(productCardPage.calories).toContainText("120");
    await expect(productCardPage.protein).toContainText("20");
    await expect(productCardPage.fat).toContainText("30");
    await expect(productCardPage.carbs).toContainText("40");
  });

  test.describe("Проверка границ названия", () => {
    const nameCases = [
      {
        title: "Ошибка при названии длиной 1 символ",
        name: "а ",
        shouldFail: true,
      },
      {
        title: "Создание продукта при названии длиной 2 символа",
        name: "аб",
        shouldFail: false,
      },
    ] as const;

    for (const c of nameCases) {
      test(c.title, async ({ page, productFormPage, productListPage }) => {
        const productName = c.shouldFail
          ? c.name
          : `${uniqueName("продукт")}-${c.name}`;

        await productFormPage.openNew();
        await productFormPage.fillBaseProduct(productName);
        await productFormPage.setBju(10, 10, 10);
        await productFormPage.submit();

        if (c.shouldFail) {
          await expect(productFormPage.errorMessage).toContainText(
            "Название не короче 2 символов"
          );
          await expect(page).toHaveURL(/\/products\/new$/);
        } else {
          await expect(page).toHaveURL(/\/products$/);

          await productListPage.open();
          await productListPage.searchByName(productName);

          await expect(productListPage.rowByName(productName)).toBeVisible();
        }
      });
    }
  });

  test.describe("Проверка суммы БЖУ", () => {
    const bjuCases = [
      {
        title: "Создание продукта при сумме БЖУ равной 100",
        protein: 40,
        fat: 30,
        carbs: 30,
        shouldFail: false,
      },
      {
        title: "Ошибка при сумме БЖУ больше 100",
        protein: 40,
        fat: 30,
        carbs: 30.1,
        shouldFail: true,
      },
    ] as const;

    for (const c of bjuCases) {
      test(c.title, async ({ page, productFormPage, productListPage }) => {
        const productName = uniqueName("бжу");

        await productFormPage.openNew();
        await productFormPage.fillBaseProduct(productName);
        await productFormPage.setBju(c.protein, c.fat, c.carbs);
        await productFormPage.submit();

        if (c.shouldFail) {
          await expect(productFormPage.errorMessage).toContainText(
            "Сумма БЖУ на 100 г не может превышать 100 г."
          );
          await expect(page).toHaveURL(/\/products\/new$/);
        } else {
          await expect(page).toHaveURL(/\/products$/);

          await productListPage.open();
          await productListPage.searchByName(productName);
          await expect(productListPage.rowByName(productName)).toBeVisible();
        }
      });
    }
  });

  test("Редактирование существующего продукта", async ({
                                                         page,
                                                         productFormPage,
                                                         productListPage,
                                                         productCardPage,
                                                       }) => {
    const oldName = uniqueName("старый-продукт");
    const newName = uniqueName("новый-продукт");

    await productFormPage.createProductViaUi({
      name: oldName,
      protein: 20,
      fat: 10,
      carbs: 20,
    });

    await expect(page).toHaveURL(/\/products$/);

    await productListPage.open();
    await productListPage.searchByName(oldName);
    await productListPage.openEditByName(oldName);

    await productFormPage.nameInput.fill(newName);
    await productFormPage.submit();

    await expect(page).toHaveURL(/\/products$/);

    await productListPage.open();
    await productListPage.searchByName(newName);
    const updatedRow = productListPage.rowByName(newName);
    await expect(updatedRow).toBeVisible();
    await productListPage.itemLinkByName(newName).click();
    await expect(productCardPage.title).toContainText(newName);
  });

  test("Удаление существующего продукта", async ({
                                                   page,
                                                   productFormPage,
                                                   productListPage,
                                                 }) => {
    const productName = uniqueName("удаление-продукта");

    await productFormPage.createProductViaUi({
      name: productName,
    });

    await expect(page).toHaveURL(/\/products$/);

    await productListPage.open();
    await productListPage.searchByName(productName);
    await productListPage.openEditByName(productName);

    await productFormPage.delete();

    await expect(page).toHaveURL(/\/products$/);

    await productListPage.open();
    await productListPage.searchByName(productName);
    await expect(productListPage.rowByName(productName)).toHaveCount(0);
  });

  test("Ошибка удаления продукта, который используется в блюде", async ({
                                                                          page,
                                                                          productFormPage,
                                                                          dishFormPage,
                                                                          productListPage,
                                                                        }) => {
    const productName = uniqueName("продукт-в-блюде");
    const dishName = uniqueName("блюдо-с-продуктом");

    await productFormPage.createProductViaUi({
      name: productName,
    });

    await expect(page).toHaveURL(/\/products$/);

    await dishFormPage.createDishViaUi({
      name: dishName,
      ingredientName: productName,
    });

    await expect(page).toHaveURL(/\/dishes$/);

    await productListPage.open();
    await productListPage.searchByName(productName);
    await productListPage.openEditByName(productName);

    await productFormPage.delete();

    await expect(productFormPage.deleteErrorMessage).toContainText(
      "Нельзя удалить продукт: он используется в блюдах"
    );

    await expect(page.getByRole("link", { name: dishName })).toBeVisible();
  });
});