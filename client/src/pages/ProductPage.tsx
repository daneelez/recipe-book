import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchProduct } from '../api'
import type { Product } from '../types'
import { ProductCard } from '../components/ProductCard'

export function ProductPage() {
  const { id } = useParams();
  const [item, setItem] = useState<Product | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    fetchProduct(id)
      .then(setItem)
      .catch((e: Error) => setErr(e.message));
  }, [id]);

  if (err) return <p className="error">{err}</p>;
  if (!item) return <p>Загрузка...</p>;

  return <ProductCard product={item} />;
}