import { expect, test } from './fixtures'
import { uniqueName } from './support/testData'

test.describe("Системные тесты формы продукта", () => {
  test("Создание продукта с корректными данными", async ({
                                                           productFormPage,
                                                           productListPage,
                                                           productCardPage,
                                                         }) => {
    const productName = uniqueName("продукт")

    await productFormPage.createProductViaUi({
      name: productName,
      calories: 120,
      protein: 20,
      fat: 30,
      carbs: 40,
      category: "VEGETABLES",
      cooking: "READY_TO_EAT",
    })

    await expect(productListPage.root).toBeVisible()

    await productListPage.searchByName(productName)
    await expect(productListPage.rowByName(productName)).toBeVisible()

    await productListPage.itemLinkByName(productName).click()

    await expect(productCardPage.root).toBeVisible()

    await expect(productCardPage.title).toContainText(productName)
    await expect(productCardPage.calories).toContainText("120")
    await expect(productCardPage.protein).toContainText("20")
    await expect(productCardPage.fat).toContainText("30")
    await expect(productCardPage.carbs).toContainText("40")
  })

  test.describe("Проверка границ названия", () => {
    test("Ошибка при названии длиной 1 символ", async ({
                                                         productFormPage,
                                                       }) => {
      const productName = "а "

      await productFormPage.openNew()
      await productFormPage.fillBaseProduct(productName)
      await productFormPage.setBju(10, 10, 10)
      await productFormPage.submit()

      await expect(productFormPage.errorMessage).toContainText(
        "Название не короче 2 символов"
      )

      await expect(productFormPage.root).toBeVisible()
    })

    test("Создание продукта при названии длиной 2 символа", async ({
                                                                     productFormPage,
                                                                     productListPage,
                                                                   }) => {
      const productName = `${uniqueName("продукт")}-аб`

      await productFormPage.openNew()
      await productFormPage.fillBaseProduct(productName)
      await productFormPage.setBju(10, 10, 10)
      await productFormPage.submit()

      await expect(productListPage.root).toBeVisible()

      await productListPage.open()
      await productListPage.searchByName(productName)

      await expect(productListPage.rowByName(productName)).toBeVisible()
    })
  })

  test.describe("Проверка суммы БЖУ", () => {
    test("Создание продукта при сумме БЖУ равной 100", async ({
                                                                page,
                                                                productFormPage,
                                                                productListPage,
                                                              }) => {
      const productName = uniqueName("бжу")

      await productFormPage.openNew()
      await productFormPage.fillBaseProduct(productName)
      await productFormPage.setBju(40, 30, 30)
      await productFormPage.submit()

      await expect(productListPage.root).toBeVisible()

      await productListPage.open()
      await productListPage.searchByName(productName)

      await expect(productListPage.rowByName(productName)).toBeVisible()
    })

    test("Ошибка при сумме БЖУ больше 100", async ({
                                                     productFormPage,
                                                   }) => {
      const productName = uniqueName("бжу")

      await productFormPage.openNew()
      await productFormPage.fillBaseProduct(productName)
      await productFormPage.setBju(40, 30, 30.1)
      await productFormPage.submit()

      await expect(productFormPage.errorMessage).toContainText(
        "Сумма БЖУ на 100 г не может превышать 100 г."
      )

      await expect(productFormPage.root).toBeVisible()
    })
  })

  test("Редактирование существующего продукта", async ({
                                                         productFormPage,
                                                         productListPage,
                                                         productCardPage,
                                                       }) => {
    const oldName = uniqueName("старый-продукт")
    const newName = uniqueName("новый-продукт")

    await productFormPage.createProductViaUi({
      name: oldName,
      protein: 20,
      fat: 10,
      carbs: 20,
    })

    await expect(productListPage.root).toBeVisible()

    await productListPage.open()
    await productListPage.searchByName(oldName)
    await productListPage.openEditByName(oldName)

    await productFormPage.nameInput.fill(newName)
    await productFormPage.submit()

    await expect(productListPage.root).toBeVisible()

    await productListPage.open()
    await productListPage.searchByName(newName)

    await expect(productListPage.rowByName(newName)).toBeVisible()

    await productListPage.itemLinkByName(newName).click()
    await expect(productCardPage.root).toBeVisible()
    await expect(productCardPage.title).toContainText(newName)
  })

  test("Удаление существующего продукта", async ({
                                                   productFormPage,
                                                   productListPage,
                                                 }) => {
    const productName = uniqueName("удаление-продукта")

    await productFormPage.createProductViaUi({
      name: productName,
    })

    await expect(productListPage.root).toBeVisible()

    await productListPage.open()
    await productListPage.searchByName(productName)
    await productListPage.openEditByName(productName)

    await productFormPage.delete()

    await expect(productListPage.root).toBeVisible()

    await productListPage.open()
    await productListPage.searchByName(productName)

    await expect(productListPage.rowByName(productName)).toHaveCount(0)
  })

  test("Ошибка удаления продукта, который используется в блюде", async ({
                                                                          page,
                                                                          productFormPage,
                                                                          dishFormPage,
                                                                          productListPage,
                                                                        }) => {
    const productName = uniqueName("продукт-в-блюде")
    const dishName = uniqueName("блюдо-с-продуктом")

    await productFormPage.createProductViaUi({
      name: productName,
    })

    await expect(productListPage.root).toBeVisible()

    await dishFormPage.createDishViaUi({
      name: dishName,
      ingredientName: productName,
    })

    await expect(dishFormPage.root).toBeVisible()

    await productListPage.open()
    await productListPage.searchByName(productName)
    await productListPage.openEditByName(productName)

    await productFormPage.delete()

    await expect(productFormPage.deleteErrorMessage).toContainText(
      "Нельзя удалить продукт: он используется в блюдах"
    )

    await expect(productFormPage.root).toBeVisible()
  })
})