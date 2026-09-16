import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Images, Plus } from 'lucide-react'
import { GeoMap } from '../components/GeoMap'
import { useVisitedLocations } from '../hooks/useVisitedLocations'
import {
  REGION_CENTER,
  REGION_GEOJSON_URL,
  REGION_LABEL,
  REGION_MAX_BOUNDS,
  REGION_MAX_ZOOM,
  REGION_MIN_ZOOM,
  REGION_ZOOM,
  getFeatureId,
  type RegionKind,
} from '../lib/regionConfig'
import { ALL_CONTINENTS_VALUE, CONTINENTS } from '../lib/continents'
import './MapScreen.css'

const REGION_KINDS: RegionKind[] = ['world', 'japan']

export function MapScreen() {
  const [region, setRegion] = useState<RegionKind>('world')
  const [continent, setContinent] = useState<string>(ALL_CONTINENTS_VALUE)
  const navigate = useNavigate()
  const { countryCodes, prefectureCodes } = useVisitedLocations()
  const visitedIds = region === 'world' ? countryCodes : prefectureCodes

  const getFeatureIdForRegion = useCallback(
    (feature: GeoJSON.Feature) => getFeatureId(region, feature),
    [region],
  )

  const selectedContinent =
    region === 'world'
      ? CONTINENTS.find((c) => c.value === continent)
      : undefined

  const featureFilter = useMemo(() => {
    if (!selectedContinent) return undefined
    return (feature: GeoJSON.Feature) =>
      feature.properties?.CONTINENT === selectedContinent.value
  }, [selectedContinent])

  const center = selectedContinent?.center ?? REGION_CENTER[region]
  const zoom = selectedContinent?.zoom ?? REGION_ZOOM[region]

  return (
    <div className="map-screen">
      <div className="map-screen__region-toggle">
        {REGION_KINDS.map((key) => (
          <button
            key={key}
            type="button"
            className={key === region ? 'is-selected' : ''}
            onClick={() => setRegion(key)}
          >
            {REGION_LABEL[key]}
          </button>
        ))}
        <Link to="/records" className="map-screen__list-link">
          <Images size={16} strokeWidth={1.5} />
          記録一覧
        </Link>
      </div>
      {region === 'world' && (
        <div className="map-screen__continent-filter">
          <select
            value={continent}
            onChange={(e) => setContinent(e.target.value)}
          >
            <option value={ALL_CONTINENTS_VALUE}>すべての大陸</option>
            {CONTINENTS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="map-screen__map-area">
        <GeoMap
          geojsonUrl={REGION_GEOJSON_URL[region]}
          center={center}
          zoom={zoom}
          minZoom={REGION_MIN_ZOOM[region]}
          maxZoom={REGION_MAX_ZOOM[region]}
          maxBounds={REGION_MAX_BOUNDS[region]}
          getFeatureId={getFeatureIdForRegion}
          visitedIds={visitedIds}
          onFeatureClick={(id) => navigate(`/region/${region}/${id}`)}
          filterKey={region === 'world' ? continent : undefined}
          featureFilter={featureFilter}
        />
        <Link to="/records/new" className="map-screen__fab" aria-label="記録を作成">
          <Plus size={24} strokeWidth={1.5} />
        </Link>
      </div>
    </div>
  )
}
