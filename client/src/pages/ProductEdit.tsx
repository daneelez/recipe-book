import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { deleteProduct, fetchProduct, saveProduct, uploadPhotos } from '../api'
import type { CookingNeed, FlagKey, ProductCategory } from '../types'
import { Select } from '../components/Select'
import { qaIds } from '../lib/qaSelectors'

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

const FLAGS: { key: FlagKey; label: string }[] = [
  { key: "VEGAN", label: "Веган" },
  { key: "GLUTEN_FREE", label: "Без глютена" },
  { key: "SUGAR_FREE", label: "Без сахара" },
];

function safeReturnTo(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

const empty = {
  name: "",
  photos: [] as string[],
  caloriesPer100g: 0,
  proteinPer100g: 0,
  fatPer100g: 0,
  carbsPer100g: 0,
  composition: "" as string | null,
  category: "VEGETABLES" as ProductCategory,
  cookingNeed: "READY_TO_EAT" as CookingNeed,
  flags: [] as FlagKey[],
};

export function ProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get("returnTo"));
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(!!id);
  const [err, setErr] = useState<string | null>(null);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);
  const [blockDishes, setBlockDishes] = useState<{ id: string; name: string }[] | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchProduct(id)
      .then((p) => {
        if (cancelled) return;
        setForm({
          name: p.name,
          photos: p.photos,
          caloriesPer100g: p.caloriesPer100g,
          proteinPer100g: p.proteinPer100g,
          fatPer100g: p.fatPer100g,
          carbsPer100g: p.carbsPer100g,
          composition: p.composition,
          category: p.category,
          cookingNeed: p.cookingNeed,
          flags: p.flags,
        });
        setLoading(false);
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const bjuSum = form.proteinPer100g + form.fatPer100g + form.carbsPer100g;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (form.name.trim().length < 2) {
      setErr("Название не короче 2 символов");
      return;
    }
    if (bjuSum > 100) {
      setErr("Сумма БЖУ на 100 г не может превышать 100 г.");
      return;
    }
    try {
      await saveProduct(id, {
        ...form,
        name: form.name.trim(),
        composition: form.composition?.trim() ? form.composition : null,
        flags: form.flags,
      });
      navigate(returnTo ?? "/products");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Ошибка");
    }
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    try {
      const urls = await uploadPhotos(files);
      setForm((f) => ({ ...f, photos: [...f.photos, ...urls].slice(0, 5) }));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Загрузка");
    }
    e.target.value = "";
  }

  function toggleFlag(key: FlagKey) {
    setForm((f) => ({
      ...f,
      flags: f.flags.includes(key) ? f.flags.filter((x) => x !== key) : [...f.flags, key],
    }));
  }

  async function onDelete() {
    if (!id) return;
    setDeleteErr(null);
    setBlockDishes(null);
    try {
      await deleteProduct(id);
      navigate(returnTo ?? "/products");
    } catch (e: unknown) {
      const ex = e as Error & { dishes?: { id: string; name: string }[] };
      setDeleteErr(ex.message);
      if (ex.dishes?.length) setBlockDishes(ex.dishes);
    }
  }

  if (loading) return <p className="muted">Загрузка…</p>;

  return (
    <form className="grid" onSubmit={onSubmit} data-qa-type={qaIds.productForm.root}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>{id ? "Редактирование продукта" : "Новый продукт"}</h2>
        <Link to={returnTo ?? "/products"}>
          <button type="button" className="secondary">
            Назад
          </button>
        </Link>
      </div>

      {returnTo && (
        <p className="muted" style={{ margin: 0 }}>
          После сохранения вы вернётесь к форме блюда.
        </p>
      )}

      {err && <p className="error" data-qa-type={qaIds.productForm.error}>{err}</p>}

      <div className="card grid cols-2">
        <div style={{ gridColumn: "1 / -1" }}>
          <label>Название</label>
          <input
            data-qa-type={qaIds.productForm.nameInput}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            minLength={2}
          />
        </div>
        <div>
          <label>Калорийность, ккал / 100 г</label>
          <input
            data-qa-type={qaIds.productForm.caloriesInput}
            type="number"
            step="0.1"
            min={0}
            value={form.caloriesPer100g}
            onChange={(e) => setForm({ ...form, caloriesPer100g: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div>
          <label>Белки / Жиры / Углеводы (г / 100 г)</label>
          <div className="row">
            <input
              data-qa-type={qaIds.productForm.proteinInput}
              type="number"
              step="0.1"
              min={0}
              max={100}
              value={form.proteinPer100g}
              onChange={(e) => setForm({ ...form, proteinPer100g: parseFloat(e.target.value) || 0 })}
            />
            <input
              data-qa-type={qaIds.productForm.fatInput}
              type="number"
              step="0.1"
              min={0}
              max={100}
              value={form.fatPer100g}
              onChange={(e) => setForm({ ...form, fatPer100g: parseFloat(e.target.value) || 0 })}
            />
            <input
              data-qa-type={qaIds.productForm.carbsInput}
              type="number"
              step="0.1"
              min={0}
              max={100}
              value={form.carbsPer100g}
              onChange={(e) => setForm({ ...form, carbsPer100g: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <p className="muted" style={{ margin: "0.35rem 0 0" }}>
            Сумма БЖУ: {bjuSum.toFixed(1)} / 100 {bjuSum > 100 ? " — превышение" : ""}
          </p>
        </div>
        <div>
          <label>Категория</label>
          <Select
            data-qa-type={qaIds.productForm.categorySelect}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as ProductCategory })}
          >
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label>Готовка</label>
          <Select
            data-qa-type={qaIds.productForm.cookingSelect}
            value={form.cookingNeed}
            onChange={(e) => setForm({ ...form, cookingNeed: e.target.value as CookingNeed })}
          >
            {COOKING.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label>Состав (текст)</label>
          <textarea value={form.composition ?? ""} onChange={(e) => setForm({ ...form, composition: e.target.value || null })} />
        </div>
        <div>
          <label>Флаги</label>
          <div className="row" style={{ marginTop: "0.35rem" }}>
            {FLAGS.map((f) => (
              <label key={f.key} className="row" style={{ cursor: "pointer" }}>
                <input type="checkbox" checked={form.flags.includes(f.key)} onChange={() => toggleFlag(f.key)} />
                {f.label}
              </label>
            ))}
          </div>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label>Фотографии (до 5)</label>
          <input type="file" accept="image/*" multiple onChange={onUpload} disabled={form.photos.length >= 5} />
          <div className="row" style={{ marginTop: "0.5rem" }}>
            {form.photos.map((url) => (
              <div key={url} className="row">
                <img className="thumb" src={url} alt="" />
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setForm((f) => ({ ...f, photos: f.photos.filter((u) => u !== url) }))}
                >
                  Убрать
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="row">
        <button data-qa-type={qaIds.productForm.saveButton} type="submit">Сохранить</button>
        {id && (
          <button data-qa-type={qaIds.productForm.deleteButton} type="button" className="danger" onClick={onDelete}>
            Удалить
          </button>
        )}
      </div>

      {deleteErr && (
        <div className="card error" data-qa-type={qaIds.productForm.deleteError}>
          <p>{deleteErr}</p>
          {blockDishes && (
            <ul>
              {blockDishes.map((d) => (
                <li key={d.id}>
                  <Link to={`/dishes/${d.id}`}>{d.name}</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
