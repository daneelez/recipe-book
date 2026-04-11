import type { Dish } from '../types'
import { Link } from 'react-router-dom'

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString()
}

export function DishCard({ dish }: { dish: Dish }) {
  return (
    <div className="card grid">
      <h2>{dish.name}</h2>

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
        <div>Ккал: {dish.caloriesPerPortion}</div>
        <div>Белки: {dish.proteinPerPortion}</div>
        <div>Жиры: {dish.fatPerPortion}</div>
        <div>Углеводы: {dish.carbsPerPortion}</div>
      </div>

      <div>
        <strong>Размер порции:</strong> {dish.portionSizeG} г
      </div>

      <div>
        <strong>Категория:</strong> {dish.categoryLabel} ({dish.category})
      </div>

      <div>
        <strong>Флаги:</strong>{' '}
        {dish.flags.length
          ? dish.flagsLabels.join(', ') + ` (${dish.flags.join(', ')})`
          : '—'}
      </div>

      <div>
        <strong>Ингредиенты:</strong>
        <table>
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
                  <Link to={`/products/${i.productId}/view`}>{i.product.name}</Link>
                </td>
                <td>{i.grams}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card grid">
        <div>
          <strong>Создано:</strong> {formatDate(dish.createdAt)}
        </div>
        <div>
          <strong>Обновлено:</strong> {formatDate(dish.updatedAt)}
        </div>
      </div>

      <div className="muted">
        ID: {dish.id}
      </div>
    </div>
  )
}