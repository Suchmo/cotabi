import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GeoMap } from '../components/GeoMap'
import { useVisitedLocations } from '../hooks/useVisitedLocations'
import { prefectureCodeForName } from '../lib/japanPrefectures'
import './MapScreen.css'

type Region = 'world' | 'japan'

const REGION_CONFIG: Record<
  Region,
  {
    label: string
    geojsonUrl: string
    center: [number, number]
    zoom: number
    getFeatureId: (feature: GeoJSON.Feature) => string | undefined
  }
> = {
  world: {
    label: '世界',
    geojsonUrl: '/geo/world-countries.geojson',
    center: [20, 0],
    zoom: 2,
    getFeatureId: (feature) =>
      feature.properties?.ISO_A2_EH as string | undefined,
  },
  japan: {
    label: '日本',
    geojsonUrl: '/geo/japan-prefectures.geojson',
    center: [36.5, 137.5],
    zoom: 5,
    getFeatureId: (feature) =>
      prefectureCodeForName(feature.properties?.N03_001 as string | undefined),
  },
}

export function MapScreen() {
  const [region, setRegion] = useState<Region>('world')
  const config = REGION_CONFIG[region]
  const { countryCodes, prefectureCodes } = useVisitedLocations()
  const visitedIds = region === 'world' ? countryCodes : prefectureCodes

  return (
    <div className="map-screen">
      <div className="map-screen__region-toggle">
        {(Object.keys(REGION_CONFIG) as Region[]).map((key) => (
          <button
            key={key}
            type="button"
            className={key === region ? 'is-selected' : ''}
            onClick={() => setRegion(key)}
          >
            {REGION_CONFIG[key].label}
          </button>
        ))}
        <Link to="/records" className="map-screen__list-link">
          記録一覧
        </Link>
      </div>
      <div className="map-screen__map-area">
        <GeoMap
          geojsonUrl={config.geojsonUrl}
          center={config.center}
          zoom={config.zoom}
          getFeatureId={config.getFeatureId}
          visitedIds={visitedIds}
        />
        <Link to="/records/new" className="map-screen__fab" aria-label="記録を作成">
          +
        </Link>
      </div>
    </div>
  )
}
