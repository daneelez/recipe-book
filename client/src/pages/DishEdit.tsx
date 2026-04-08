import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { deleteDish, fetchDish, fetchProducts, previewDishKbju, saveDish, uploadPhotos } from "../api";
import { extractDishMacro } from "../lib/macros";
import { allowedDishFlagsFromProducts, sanitizeDishFlags } from "../lib/dishFlags";
import type { DishCategory, FlagKey, Product } from "../types";

const DISH_CATS: { value: DishCategory; label: string }[] = [
  { value: "DESSERT", label: "Десерт" },
  { value: "FIRST", label: "Первое" },
  { value: "SECOND", label: "Второе" },
  { value: "DRINK", label: "Напиток" },
  { value: "SALAD", label: "Салат" },
  { value: "SOUP", label: "Суп" },
  { value: "SNACK", label: "Перекус" },
];

const FLAGS: { key: FlagKey; label: string }[] = [
  { key: "VEGAN", label: "Веган" },
  { key: "GLUTEN_FREE", label: "Без глютена" },
  { key: "SUGAR_FREE", label: "Без сахара" },
];

type IngRow = { productId: string; grams: number };

export function DishEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const createProductHref = `/products/new?returnTo=${encodeURIComponent(location.pathname)}`;
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<DishCategory>("FIRST");
  const [portionSizeG, setPortionSizeG] = useState(100);
  const [photos, setPhotos] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<IngRow[]>([{ productId: "", grams: 100 }]);
  const [flags, setFlags] = useState<FlagKey[]>([]);
  const [caloriesPerPortion, setCaloriesPerPortion] = useState(0);
  const [proteinPerPortion, setProteinPerPortion] = useState(0);
  const [fatPerPortion, setFatPerPortion] = useState(0);
  const [carbsPerPortion, setCarbsPerPortion] = useState(0);
  const [loading, setLoading] = useState(!!id);
  const [err, setErr] = useState<string | null>(null);

  const productById = useMemo(() => new Map(catalog.map((p) => [p.id, p])), [catalog]);

  const resolvedProducts = useMemo(() => {
    const list: Product[] = [];
    for (const ing of ingredients) {
      if (!ing.productId) continue;
      const p = productById.get(ing.productId);
      if (p) list.push(p);
    }
    return list;
  }, [ingredients, productById]);

  const allowedFlagSet = useMemo(() => allowedDishFlagsFromProducts(resolvedProducts), [resolvedProducts]);

  useEffect(() => {
    fetchProducts({})
      .then(setCatalog)
      .catch(() => {});
  }, [location.key]);

  useEffect(() => {
    setFlags((prev) => sanitizeDishFlags(prev, allowedFlagSet));
  }, [allowedFlagSet]);

  const recalcKbju = useCallback(async () => {
    const rows = ingredients.filter((i) => i.productId && i.grams > 0);
    if (rows.length === 0) return;
    try {
      const k = await previewDishKbju(rows.map((r) => ({ productId: r.productId, grams: r.grams })));
      setCaloriesPerPortion(k.caloriesPerPortion);
      setProteinPerPortion(k.proteinPerPortion);
      setFatPerPortion(k.fatPerPortion);
      setCarbsPerPortion(k.carbsPerPortion);
    } catch {
      /* ignore preview errors until submit */
    }
  }, [ingredients]);

  useEffect(() => {
    const t = setTimeout(() => {
      void recalcKbju();
    }, 250);
    return () => clearTimeout(t);
  }, [recalcKbju]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchDish(id)
      .then((d) => {
        if (cancelled) return;
        setName(d.name);
        setCategory(d.category);
        setPortionSizeG(d.portionSizeG);
        setPhotos(d.photos);
        setFlags(d.flags);
        setCaloriesPerPortion(d.caloriesPerPortion);
        setProteinPerPortion(d.proteinPerPortion);
        setFatPerPortion(d.fatPerPortion);
        setCarbsPerPortion(d.carbsPerPortion);
        setIngredients(
          d.ingredients.length
            ? d.ingredients.map((i) => ({ productId: i.productId, grams: i.grams }))
            : [{ productId: "", grams: 100 }]
        );
        setLoading(false);
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  function onNameChange(v: string) {
    const { cleanName, categoryFromMacro } = extractDishMacro(v);
    if (categoryFromMacro) {
      setName(cleanName);
      setCategory(categoryFromMacro);
    } else {
      setName(v);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const rows = ingredients.filter((i) => i.productId && i.grams > 0);
    if (rows.length < 1) {
      setErr("Добавьте хотя бы один продукт в состав");
      return;
    }
    if (name.trim().length < 2) {
      setErr("Название не короче 2 символов");
      return;
    }
    try {
      await saveDish(id, {
        name: name.trim(),
        photos,
        caloriesPerPortion,
        proteinPerPortion,
        fatPerPortion,
        carbsPerPortion,
        portionSizeG,
        category,
        flags: sanitizeDishFlags(flags, allowedFlagSet),
        ingredients: rows.map((r) => ({ productId: r.productId, grams: r.grams })),
      });
      navigate("/dishes");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Ошибка");
    }
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    try {
      const urls = await uploadPhotos(files);
      setPhotos((p) => [...p, ...urls].slice(0, 5));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Загрузка");
    }
    e.target.value = "";
  }

  function toggleFlag(key: FlagKey) {
    if (!allowedFlagSet.has(key)) return;
    setFlags((f) => (f.includes(key) ? f.filter((x) => x !== key) : [...f, key]));
  }

  function updateIngredient(index: number, patch: Partial<IngRow>) {
    setIngredients((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  if (loading) return <p className="muted">Загрузка…</p>;

  return (
    <form className="grid" onSubmit={onSubmit}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>{id ? "Редактирование блюда" : "Новое блюдо"}</h2>
        <Link to="/dishes">
          <button type="button" className="secondary">
            Назад
          </button>
        </Link>
      </div>

      <p className="muted">
        В названии можно использовать макросы: <code>!десерт</code>, <code>!первое</code>, <code>!второе</code>,{" "}
        <code>!напиток</code>, <code>!салат</code>, <code>!суп</code>, <code>!перекус</code>. После распознавания макрос
        исчезает из поля, категория подставляется в список ниже (её можно сменить вручную до сохранения).
      </p>

      {err && <p className="error">{err}</p>}

      <div className="card grid cols-2">
        <div style={{ gridColumn: "1 / -1" }}>
          <label>Название</label>
          <input value={name} onChange={(e) => onNameChange(e.target.value)} required minLength={2} />
        </div>
        <div>
          <label>Категория блюда</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as DishCategory)}>
            {DISH_CATS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Размер порции, г</label>
          <input
            type="number"
            step="0.1"
            min={0.1}
            value={portionSizeG}
            onChange={(e) => setPortionSizeG(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label>КБЖУ на порцию (черновик — пересчитывается из состава; можно править вручную)</label>
          <div className="row">
            <input
              type="number"
              step="0.1"
              min={0}
              value={caloriesPerPortion}
              onChange={(e) => setCaloriesPerPortion(parseFloat(e.target.value) || 0)}
              title="ккал"
            />
            <input
              type="number"
              step="0.1"
              min={0}
              value={proteinPerPortion}
              onChange={(e) => setProteinPerPortion(parseFloat(e.target.value) || 0)}
              title="белки"
            />
            <input
              type="number"
              step="0.1"
              min={0}
              value={fatPerPortion}
              onChange={(e) => setFatPerPortion(parseFloat(e.target.value) || 0)}
              title="жиры"
            />
            <input
              type="number"
              step="0.1"
              min={0}
              value={carbsPerPortion}
              onChange={(e) => setCarbsPerPortion(parseFloat(e.target.value) || 0)}
              title="углеводы"
            />
          </div>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label>Состав (продукты и количество, г)</label>
          {ingredients.map((row, idx) => (
            <div key={idx} className="row" style={{ marginBottom: "0.5rem" }}>
              <select
                value={row.productId}
                onChange={(e) => updateIngredient(idx, { productId: e.target.value })}
                style={{ flex: 2, minWidth: "200px" }}
              >
                <option value="">— продукт —</option>
                {catalog.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.1"
                min={0.1}
                value={row.grams}
                onChange={(e) => updateIngredient(idx, { grams: parseFloat(e.target.value) || 0 })}
                style={{ width: "100px" }}
              />
              <button
                type="button"
                className="secondary"
                onClick={() => setIngredients((prev) => prev.filter((_, i) => i !== idx))}
                disabled={ingredients.length <= 1}
              >
                Удалить
              </button>
            </div>
          ))}
          <button
            type="button"
            className="secondary"
            onClick={() => setIngredients((prev) => [...prev, { productId: "", grams: 100 }])}
          >
            Добавить продукт
          </button>
          <p className="muted" style={{ margin: "0.5rem 0 0" }}>
            Нет нужного продукта?{" "}
            <Link to={createProductHref}>
              Создать продукт
            </Link>{" "}
            — после сохранения вы вернётесь к этому блюду.
          </p>
        </div>

        <div>
          <label>Флаги блюда</label>
          <div className="row" style={{ marginTop: "0.35rem", flexDirection: "column", alignItems: "flex-start" }}>
            {FLAGS.map((f) => (
              <label key={f.key} className="row" style={{ cursor: allowedFlagSet.has(f.key) ? "pointer" : "not-allowed" }}>
                <input
                  type="checkbox"
                  disabled={!allowedFlagSet.has(f.key)}
                  checked={flags.includes(f.key)}
                  onChange={() => toggleFlag(f.key)}
                />
                {f.label}
                {!allowedFlagSet.has(f.key) && <span className="muted"> — недоступно по составу</span>}
              </label>
            ))}
          </div>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label>Фотографии (до 5)</label>
          <input type="file" accept="image/*" multiple onChange={onUpload} disabled={photos.length >= 5} />
          <div className="row" style={{ marginTop: "0.5rem" }}>
            {photos.map((url) => (
              <div key={url} className="row">
                <img className="thumb" src={url} alt="" />
                <button type="button" className="secondary" onClick={() => setPhotos((p) => p.filter((u) => u !== url))}>
                  Убрать
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="row">
        <button type="submit">Сохранить</button>
        {id && (
          <button
            type="button"
            className="danger"
            onClick={async () => {
              if (!id) return;
              try {
                await deleteDish(id);
                navigate("/dishes");
              } catch (e: unknown) {
                setErr(e instanceof Error ? e.message : "Ошибка");
              }
            }}
          >
            Удалить
          </button>
        )}
      </div>
    </form>
  );
}
