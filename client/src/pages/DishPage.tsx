import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchDish } from '../api'
import type { Dish } from '../types'
import { DishCard } from '../components/DishCard'

export function DishPage() {
  const { id } = useParams()
  const [item, setItem] = useState<Dish | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    fetchDish(id)
      .then(setItem)
      .catch((e: Error) => setErr(e.message))
  }, [id])

  if (err) return <p className="error">{err}</p>
  if (!item) return <p>Загрузка...</p>

  return <DishCard dish={item} />
}