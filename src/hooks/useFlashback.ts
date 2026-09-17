import { useEffect, useState } from 'react'
import { listFlashbackSpots, type FlashbackSpot } from '../lib/records'

export function useFlashback(): { items: FlashbackSpot[]; loading: boolean } {
  const [items, setItems] = useState<FlashbackSpot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    listFlashbackSpots().then((result) => {
      if (cancelled) return
      setItems(result)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  return { items, loading }
}
