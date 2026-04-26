import type { Product } from '../types'
import { qaIds } from '../lib/qaSelectors'

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="card grid">
      <h2 data-testid={qaIds.productCard.title}>{product.name}</h2>

      <div className="row">
        {product.photos.length ? (
          product.photos.map((p) => (
            <img key={p} src={p} className="thumb" />
          ))
        ) : (
          <div className="muted">Нет фото</div>
        )}
      </div>

      <div className="grid cols-4">
        <div data-testid={qaIds.productCard.calories}>
          Ккал: {product.caloriesPer100g}
        </div>

        <div data-testid={qaIds.productCard.protein}>
          Белки: {product.proteinPer100g}
        </div>

        <div data-testid={qaIds.productCard.fat}>
          Жиры: {product.fatPer100g}
        </div>

        <div data-testid={qaIds.productCard.carbs}>
          Углеводы: {product.carbsPer100g}
        </div>
      </div>

      <div data-testid={qaIds.productCard.category}>
        <strong>Категория:</strong> {product.categoryLabel} ({product.category})
      </div>

      <div data-testid={qaIds.productCard.cooking}>
        <strong>Готовка:</strong> {product.cookingNeedLabel} ({product.cookingNeed})
      </div>

      <div data-testid={qaIds.productCard.composition}>
        <strong>Состав:</strong>
        <p>{product.composition || "—"}</p>
      </div>

      <div data-testid={qaIds.productCard.flags}>
        <strong>Флаги:</strong>{" "}
        {product.flags.length
          ? product.flagsLabels.join(", ") + ` (${product.flags.join(", ")})`
          : "—"}
      </div>

      <div className="card grid">
        <div data-testid={qaIds.productCard.createdAt}>
          <strong>Создан:</strong> {formatDate(product.createdAt)}
        </div>

        <div data-testid={qaIds.productCard.updatedAt}>
          <strong>Обновлён:</strong> {formatDate(product.updatedAt)}
        </div>
      </div>

      <div
        className="muted"
        data-testid={qaIds.productCard.id}
      >
        ID: {product.id}
      </div>
    </div>
  );
}