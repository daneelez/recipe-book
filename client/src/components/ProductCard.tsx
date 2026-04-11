import type { Product } from '../types'

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString()
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="card grid">
      <h2>{product.name}</h2>

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
        <div>Ккал: {product.caloriesPer100g}</div>
        <div>Белки: {product.proteinPer100g}</div>
        <div>Жиры: {product.fatPer100g}</div>
        <div>Углеводы: {product.carbsPer100g}</div>
      </div>

      <div>
        <strong>Категория:</strong> {product.categoryLabel} ({product.category})
      </div>

      <div>
        <strong>Готовка:</strong> {product.cookingNeedLabel} ({product.cookingNeed})
      </div>

      <div>
        <strong>Состав:</strong>
        <p>{product.composition || '—'}</p>
      </div>

      <div>
        <strong>Флаги:</strong>{' '}
        {product.flags.length
          ? product.flagsLabels.join(', ') + ` (${product.flags.join(', ')})`
          : '—'}
      </div>

      <div className="card grid">
        <div>
          <strong>Создан:</strong> {formatDate(product.createdAt)}
        </div>
        <div>
          <strong>Обновлён:</strong> {formatDate(product.updatedAt)}
        </div>
      </div>

      <div className="muted">
        ID: {product.id}
      </div>
    </div>
  )
}