import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Images, Plus } from 'lucide-react'
import { GeoMap } from '../components/GeoMap'
import { useVisitedLocations } from '../hooks/useVisitedLocations'
import {
  REGION_CENTER,
  REGION_GEOJSON_URL,
  REGION_LABEL,
  REGION_ZOOM,
  getFeatureId,
  type RegionKind,
} from '../lib/regionConfig'
import './MapScreen.css'

const REGION_KINDS: RegionKind[] = ['world', 'japan']

export function MapScreen() {
  const [region, setRegion] = useState<RegionKind>('world')
  const navigate = useNavigate()
  const { countryCodes, prefectureCodes } = useVisitedLocations()
  const visitedIds = region === 'world' ? countryCodes : prefectureCodes

  const getFeatureIdForRegion = useCallback(
    (feature: GeoJSON.Feature) => getFeatureId(region, feature),
    [region],
  )

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
      <div className="map-screen__map-area">
        <GeoMap
          geojsonUrl={REGION_GEOJSON_URL[region]}
          center={REGION_CENTER[region]}
          zoom={REGION_ZOOM[region]}
          getFeatureId={getFeatureIdForRegion}
          visitedIds={visitedIds}
          onFeatureClick={(id) => navigate(`/region/${region}/${id}`)}
        />
        <Link to="/records/new" className="map-screen__fab" aria-label="記録を作成">
          <Plus size={24} strokeWidth={1.5} />
        </Link>
      </div>
    </div>
  )
}
