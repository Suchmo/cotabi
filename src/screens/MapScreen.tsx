import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GeoMap } from '../components/GeoMap'
import './MapScreen.css'

type Region = 'world' | 'japan'

const REGION_CONFIG: Record<
  Region,
  { label: string; geojsonUrl: string; center: [number, number]; zoom: number }
> = {
  world: {
    label: '世界',
    geojsonUrl: '/geo/world-countries.geojson',
    center: [20, 0],
    zoom: 2,
  },
  japan: {
    label: '日本',
    geojsonUrl: '/geo/japan-prefectures.geojson',
    center: [36.5, 137.5],
    zoom: 5,
  },
}

export function MapScreen() {
  const [region, setRegion] = useState<Region>('world')
  const config = REGION_CONFIG[region]

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
        />
        <Link to="/records/new" className="map-screen__fab" aria-label="記録を作成">
          +
        </Link>
      </div>
    </div>
  )
}
