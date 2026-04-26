import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchProducts } from '../api'
import { qaIds } from '../lib/qaSelectors'
import type { CookingNeed, Product, ProductCategory } from '../types'
import { Select } from '../components/Select'

const PRODUCT_CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: "FROZEN", label: "Замороженный" },
  { value: "MEAT", label: "Мясной" },
  { value: "VEGETABLES", label: "Овощи" },
  { value: "GREENS", label: "Зелень" },
  { value: "SPICES", label: "Специи" },
  { value: "GRAINS", label: "Крупы" },
  { value: "CANNED", label: "Консервы" },
  { value: "LIQUID", label: "Жидкость" },
  { value: "SWEETS", label: "Сладости" },
];

const COOKING: { value: CookingNeed; label: string }[] = [
  { value: "READY_TO_EAT", label: "Готовый к употреблению" },
  { value: "SEMI_FINISHED", label: "Полуфабрикат" },
  { value: "REQUIRES_COOKING", label: "Требует приготовления" },
];

export function ProductList() {
  const [items, setItems] = useState<Product[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [cookingNeed, setCookingNeed] = useState("");
  const [vegan, setVegan] = useState(false);
  const [glutenFree, setGlutenFree] = useState(false);
  const [sugarFree, setSugarFree] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"name" | "calories" | "protein" | "fat" | "carbs">("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  const params = useMemo(
    () => ({
      category: category || undefined,
      cookingNeed: cookingNeed || undefined,
      vegan: vegan ? "true" : undefined,
      glutenFree: glutenFree ? "true" : undefined,
      sugarFree: sugarFree ? "true" : undefined,
      search: search || undefined,
      sort,
      order,
    }),
    [category, cookingNeed, vegan, glutenFree, sugarFree, search, sort, order]
  );

  useEffect(() => {
    let cancelled = false;
    setErr(null);
    fetchProducts(params)
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [params]);

  return (
    <div className="grid">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>Продукты</h2>
        <Link to="/products/new">
          <button data-qa-type={qaIds.productList.createButton} type="button">Новый продукт</button>
        </Link>
      </div>

      <div className="card grid">
        <div className="grid cols-2">
          <div>
            <label>Поиск по названию</label>
            <input
              data-qa-type={qaIds.productList.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Подстрока…"
            />
          </div>
          <div>
            <label>Категория</label>
            <Select data-qa-type={qaIds.productList.categorySelect} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Все</option>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label>Готовка</label>
            <Select data-qa-type={qaIds.productList.cookingSelect} value={cookingNeed} onChange={(e) => setCookingNeed(e.target.value)}>
              <option value="">Все</option>
              {COOKING.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label>Флаги</label>
            <div className="row" style={{ marginTop: "0.35rem" }}>
              <label className="row" style={{ cursor: "pointer" }}>
                <input data-qa-type={qaIds.productList.veganCheckbox} type="checkbox" checked={vegan} onChange={(e) => setVegan(e.target.checked)} /> Веган
              </label>
              <label className="row" style={{ cursor: "pointer" }}>
                <input data-qa-type={qaIds.productList.glutenFreeCheckbox} type="checkbox" checked={glutenFree} onChange={(e) => setGlutenFree(e.target.checked)} /> Без глютена
              </label>
              <label className="row" style={{ cursor: "pointer" }}>
                <input data-qa-type={qaIds.productList.sugarFreeCheckbox} type="checkbox" checked={sugarFree} onChange={(e) => setSugarFree(e.target.checked)} /> Без сахара
              </label>
            </div>
          </div>
          <div>
            <label>Сортировка</label>
            <Select data-qa-type={qaIds.productList.sortSelect} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
              <option value="name">Название</option>
              <option value="calories">Калорийность</option>
              <option value="protein">Белки</option>
              <option value="fat">Жиры</option>
              <option value="carbs">Углеводы</option>
            </Select>
          </div>
          <div>
            <label>Порядок</label>
            <Select data-qa-type={qaIds.productList.orderSelect} value={order} onChange={(e) => setOrder(e.target.value as "asc" | "desc")}>
              <option value="asc">По возрастанию</option>
              <option value="desc">По убыванию</option>
            </Select>
          </div>
        </div>
      </div>

      {err && <p className="error">{err}</p>}

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Название</th>
              <th>Редактировать</th>
              <th>Категория</th>
              <th>ккал/100г</th>
              <th>Б / Ж / У</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.photos[0] ? (
                    <img className="thumb" src={p.photos[0]} alt="" />
                  ) : (
                    <div className="thumb muted" />
                  )}
                </td>
                <td>
                  <Link data-qa-type={qaIds.productList.itemLink} to={`/products/${p.id}/view`}>
                    {p.name}
                  </Link>
                </td>
                <td>
                  <Link data-qa-type={qaIds.productList.editLink} to={`/products/${p.id}`}>Изменить</Link>
                </td>
                <td>{p.categoryLabel}</td>
                <td>{p.caloriesPer100g.toFixed(1)}</td>
                <td>
                  {p.proteinPer100g.toFixed(1)} / {p.fatPer100g.toFixed(1)} / {p.carbsPer100g.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && !err && <p className="muted">Нет продуктов по фильтрам.</p>}
      </div>
    </div>
  );
}
