import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchDishes } from '../api'
import type { Dish, DishCategory } from '../types'
import { Select } from '../components/Select'

const DISH_CATS: { value: DishCategory; label: string }[] = [
  { value: "DESSERT", label: "Десерт" },
  { value: "FIRST", label: "Первое" },
  { value: "SECOND", label: "Второе" },
  { value: "DRINK", label: "Напиток" },
  { value: "SALAD", label: "Салат" },
  { value: "SOUP", label: "Суп" },
  { value: "SNACK", label: "Перекус" },
];

export function DishList() {
  const [items, setItems] = useState<Dish[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [vegan, setVegan] = useState(false);
  const [glutenFree, setGlutenFree] = useState(false);
  const [sugarFree, setSugarFree] = useState(false);
  const [search, setSearch] = useState("");

  const params = useMemo(
    () => ({
      category: category || undefined,
      vegan: vegan ? "true" : undefined,
      glutenFree: glutenFree ? "true" : undefined,
      sugarFree: sugarFree ? "true" : undefined,
      search: search || undefined,
    }),
    [category, vegan, glutenFree, sugarFree, search]
  );

  useEffect(() => {
    let cancelled = false;
    setErr(null);
    fetchDishes(params)
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
        <h2 style={{ margin: 0 }}>Блюда</h2>
        <Link to="/dishes/new">
          <button type="button">Новое блюдо</button>
        </Link>
      </div>

      <div className="card grid cols-2">
        <div>
          <label>Поиск по названию</label>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Подстрока…" />
        </div>
        <div>
          <label>Категория блюда</label>
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Все</option>
            {DISH_CATS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label>Флаги</label>
          <div className="row" style={{ marginTop: "0.35rem" }}>
            <label className="row" style={{ cursor: "pointer" }}>
              <input type="checkbox" checked={vegan} onChange={(e) => setVegan(e.target.checked)} /> Веган
            </label>
            <label className="row" style={{ cursor: "pointer" }}>
              <input type="checkbox" checked={glutenFree} onChange={(e) => setGlutenFree(e.target.checked)} /> Без глютена
            </label>
            <label className="row" style={{ cursor: "pointer" }}>
              <input type="checkbox" checked={sugarFree} onChange={(e) => setSugarFree(e.target.checked)} /> Без сахара
            </label>
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
              <th>ккал / порция</th>
              <th>Порция, г</th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.id}>
                <td>
                  {d.photos[0] ? (
                    <img className="thumb" src={d.photos[0]} alt="" />
                  ) : (
                    <div className="thumb muted" />
                  )}
                </td>
                <td>
                  <Link to={`/dishes/${d.id}/view`}>{d.name}</Link>
                </td>
                <td>
                  <Link to={`/dishes/${d.id}`}>Изменить</Link>
                </td>
                <td>{d.categoryLabel}</td>
                <td>{d.caloriesPerPortion.toFixed(1)}</td>
                <td>{d.portionSizeG.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && !err && <p className="muted">Нет блюд по фильтрам.</p>}
      </div>
    </div>
  );
}
