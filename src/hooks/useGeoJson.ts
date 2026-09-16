import { useEffect, useState } from 'react'

const cache = new Map<string, GeoJSON.FeatureCollection>()

export function useGeoJson(url: string) {
  const [data, setData] = useState<GeoJSON.FeatureCollection | null>(
    cache.get(url) ?? null,
  )

  useEffect(() => {
    const cached = cache.get(url)
    if (cached) {
      setData(cached)
      return
    }

    let cancelled = false
    setData(null)

    fetch(url)
      .then((res) => res.json())
      .then((json: GeoJSON.FeatureCollection) => {
        if (cancelled) return
        cache.set(url, json)
        setData(json)
      })

    return () => {
      cancelled = true
    }
  }, [url])

  return data
}
