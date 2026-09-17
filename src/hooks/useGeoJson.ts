import { useCallback, useEffect, useState } from 'react'

const cache = new Map<string, GeoJSON.FeatureCollection>()

type GeoJsonState = {
  data: GeoJSON.FeatureCollection | null
  loading: boolean
  error: boolean
}

export function useGeoJson(url: string) {
  const [state, setState] = useState<GeoJsonState>(() => {
    const cached = cache.get(url)
    return { data: cached ?? null, loading: !cached, error: false }
  })
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    const cached = cache.get(url)
    if (cached) {
      setState({ data: cached, loading: false, error: false })
      return
    }

    let cancelled = false
    setState({ data: null, loading: true, error: false })

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`GeoJSON fetch failed: ${res.status}`)
        return res.json() as Promise<GeoJSON.FeatureCollection>
      })
      .then((json) => {
        if (cancelled) return
        cache.set(url, json)
        setState({ data: json, loading: false, error: false })
      })
      .catch(() => {
        if (cancelled) return
        setState({ data: null, loading: false, error: true })
      })

    return () => {
      cancelled = true
    }
  }, [url, retryToken])

  const retry = useCallback(() => setRetryToken((t) => t + 1), [])

  return { ...state, retry }
}
