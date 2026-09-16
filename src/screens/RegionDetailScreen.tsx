import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { RouteMap } from '../components/RouteMap'
import { BackLink } from '../components/BackLink'
import { useGeoJson } from '../hooks/useGeoJson'
import {
  REGION_CENTER,
  REGION_GEOJSON_URL,
  REGION_ZOOM,
  getFeatureId,
  type RegionKind,
} from '../lib/regionConfig'
import { getRegionRoutes, type TripRoute, type LocatedSpot } from '../lib/regionRoutes'
import { COUNTRIES } from '../lib/countries'
import { JAPAN_COUNTRY_CODE, JAPAN_PREFECTURES } from '../lib/japanPrefectures'
import './RegionDetailScreen.css'

const countryNameByCode = new Map(COUNTRIES.map((c) => [c.code, c.name]))
const prefectureNameByCode = new Map(
  JAPAN_PREFECTURES.map((p) => [p.code, p.name]),
)

function regionTitle(kind: RegionKind, code: string): string {
  if (kind === 'world') return countryNameByCode.get(code) ?? code
  return prefectureNameByCode.get(code) ?? code
}

export function RegionDetailScreen() {
  const params = useParams<{ kind: string; code: string }>()
  const navigate = useNavigate()
  const kind: RegionKind = params.kind === 'japan' ? 'japan' : 'world'
  const code = params.code ?? ''

  const geojson = useGeoJson(REGION_GEOJSON_URL[kind])
  const boundaryFeature = useMemo(() => {
    if (!geojson) return null
    return (
      geojson.features.find((f) => getFeatureId(kind, f) === code) ?? null
    )
  }, [geojson, kind, code])

  const [routes, setRoutes] = useState<TripRoute[] | null>(null)
  const [pins, setPins] = useState<LocatedSpot[]>([])

  useEffect(() => {
    const region =
      kind === 'world'
        ? { countryCode: code, prefectureCode: null }
        : { countryCode: JAPAN_COUNTRY_CODE, prefectureCode: code }

    setRoutes(null)
    getRegionRoutes(region).then(({ routes, pins }) => {
      setRoutes(routes)
      setPins(pins)
    })
  }, [kind, code])

  return (
    <div className="region-detail">
      <div className="region-detail__header">
        <BackLink to="/map" label="マップに戻る" />
        <h1>{regionTitle(kind, code)}</h1>
      </div>
      {routes && routes.length > 0 && (
        <div className="region-detail__legend">
          {routes.map((route) => (
            <button
              key={route.tripId}
              type="button"
              className="region-detail__legend-item"
              onClick={() => navigate(`/trips/${route.tripId}`)}
            >
              <span
                className="region-detail__legend-dot"
                style={{ background: route.color }}
              />
              {route.title}
            </button>
          ))}
        </div>
      )}
      {routes === null && <p className="region-detail__empty">読み込み中…</p>}
      {routes && routes.length === 0 && pins.length === 0 && (
        <p className="region-detail__empty">
          この地域にはまだ位置情報付きの記録がありません。
        </p>
      )}
      <div className="region-detail__map-area">
        <RouteMap
          center={REGION_CENTER[kind]}
          zoom={REGION_ZOOM[kind]}
          boundaryFeature={boundaryFeature}
          routes={routes ?? []}
          pins={pins}
          onRouteClick={(tripId) => navigate(`/trips/${tripId}`)}
        />
      </div>
    </div>
  )
}
