import type { Dish } from '../types'
import { Link } from 'react-router-dom'
import { qaIds } from '../lib/qaSelectors'

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}

export function DishCard({ dish }: { dish: Dish }) {
  return (
    <div className="card grid" data-testid={qaIds.dishCard.root}>
      <h2 data-testid={qaIds.dishCard.title}>{dish.name}</h2>

      <div className="row">
        {dish.photos.length ? (
          dish.photos.map((p) => (
            <img key={p} src={p} className="thumb" />
          ))
        ) : (
          <div className="muted">Нет фото</div>
        )}
      </div>

      <div className="grid cols-4">
        <div data-testid={qaIds.dishCard.calories}>
          Ккал: {dish.caloriesPerPortion}
        </div>

        <div data-testid={qaIds.dishCard.protein}>
          Белки: {dish.proteinPerPortion}
        </div>

        <div data-testid={qaIds.dishCard.fat}>
          Жиры: {dish.fatPerPortion}
        </div>

        <div data-testid={qaIds.dishCard.carbs}>
          Углеводы: {dish.carbsPerPortion}
        </div>
      </div>

      <div data-testid={qaIds.dishCard.portionSize}>
        <strong>Размер порции:</strong> {dish.portionSizeG} г
      </div>

      <div data-testid={qaIds.dishCard.category}>
        <strong>Категория:</strong> {dish.categoryLabel} ({dish.category})
      </div>

      <div data-testid={qaIds.dishCard.flags}>
        <strong>Флаги:</strong>{" "}
        {dish.flags.length
          ? dish.flagsLabels.join(", ") + ` (${dish.flags.join(", ")})`
          : "—"}
      </div>

      <div>
        <strong>Ингредиенты:</strong>

        <table data-testid={qaIds.dishCard.ingredientsTable}>
          <thead>
            <tr>
              <th>Продукт</th>
              <th>Граммы</th>
            </tr>
          </thead>

          <tbody>
            {dish.ingredients.map((i) => (
              <tr key={i.productId}>
                <td>
                  <Link to={`/products/${i.productId}/view`}>
                    {i.product.name}
                  </Link>
                </td>
                <td>{i.grams}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card grid">
        <div data-testid={qaIds.dishCard.createdAt}>
          <strong>Создано:</strong> {formatDate(dish.createdAt)}
        </div>

        <div data-testid={qaIds.dishCard.updatedAt}>
          <strong>Обновлено:</strong> {formatDate(dish.updatedAt)}
        </div>
      </div>

      <div
        className="muted"
        data-testid={qaIds.dishCard.id}
      >
        ID: {dish.id}
      </div>
    </div>
  );
}