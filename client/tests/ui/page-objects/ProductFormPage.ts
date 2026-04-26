import type { Locator, Page } from '@playwright/test'
import { qaSelectors } from '../support/selectors'

export class ProductFormPage {
  readonly page: Page;

  readonly nameInput: Locator;
  readonly caloriesInput: Locator;
  readonly proteinInput: Locator;
  readonly fatInput: Locator;
  readonly carbsInput: Locator;
  readonly saveButton: Locator;
  readonly deleteButton: Locator;
  readonly categorySelect: Locator;
  readonly cookingSelect: Locator;
  readonly errorMessage: Locator;
  readonly deleteErrorMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    this.nameInput = page.locator(qaSelectors.productForm.nameInput);
    this.caloriesInput = page.locator(qaSelectors.productForm.caloriesInput);
    this.proteinInput = page.locator(qaSelectors.productForm.proteinInput);
    this.fatInput = page.locator(qaSelectors.productForm.fatInput);
    this.carbsInput = page.locator(qaSelectors.productForm.carbsInput);
    this.saveButton = page.locator(qaSelectors.productForm.saveButton);
    this.deleteButton = page.locator(qaSelectors.productForm.deleteButton);
    this.categorySelect = page.locator(qaSelectors.productForm.categorySelect);
    this.cookingSelect = page.locator(qaSelectors.productForm.cookingSelect);
    this.errorMessage = page.locator(qaSelectors.productForm.error);
    this.deleteErrorMessage = page.locator(qaSelectors.productForm.deleteError);
  }

  async openNew(): Promise<void> {
    await this.page.goto("/products/new");
  }

  async openEdit(id: string): Promise<void> {
    await this.page.goto(`/products/${id}`);
  }

  async openView(id: string): Promise<void> {
    await this.page.goto(`/products/${id}/view`);
  }

  async openList(): Promise<void> {
    await this.page.goto("/products");
  }

  async fillBaseProduct(name: string): Promise<void> {
    await this.nameInput.fill(name);
    await this.caloriesInput.fill("120");
    await this.categorySelect.selectOption("VEGETABLES");
    await this.cookingSelect.selectOption("READY_TO_EAT");
  }

  async setCalories(value: number): Promise<void> {
    await this.caloriesInput.fill(String(value));
  }

  async setBju(protein: number, fat: number, carbs: number): Promise<void> {
    await this.proteinInput.fill(String(protein));
    await this.fatInput.fill(String(fat));
    await this.carbsInput.fill(String(carbs));
  }

  async selectCategory(value: string): Promise<void> {
    await this.categorySelect.selectOption(value);
  }

  async selectCookingType(value: string): Promise<void> {
    await this.cookingSelect.selectOption(value);
  }

  async submit(): Promise<void> {
    await this.saveButton.click();
  }

  async delete(): Promise<void> {
    await this.deleteButton.click();
  }

  async createProductViaUi(params: {
    name: string;
    calories?: number;
    protein?: number;
    fat?: number;
    carbs?: number;
    category?: string;
    cooking?: string;
  }): Promise<void> {
    await this.openNew();
    await this.fillBaseProduct(params.name);

    await this.setCalories(params.calories ?? 120);
    await this.setBju(
      params.protein ?? 20,
      params.fat ?? 10,
      params.carbs ?? 20,
    );

    if (params.category) {
      await this.selectCategory(params.category);
    }

    if (params.cooking) {
      await this.selectCookingType(params.cooking);
    }

    await this.submit();
  }
}
