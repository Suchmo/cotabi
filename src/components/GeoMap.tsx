import { useMemo, useRef } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import type { Layer, LatLngExpression, PathOptions } from 'leaflet'
import { useGeoJson } from '../hooks/useGeoJson'

const VISITED_STYLE: PathOptions = {
  fillColor: '#c4a45c',
  fillOpacity: 0.55,
  color: '#a3823f',
  weight: 1,
}

const UNVISITED_STYLE: PathOptions = {
  fillColor: '#d1d5db',
  fillOpacity: 0.35,
  color: '#9ca3af',
  weight: 1,
}

type GeoMapProps = {
  geojsonUrl: string
  center: LatLngExpression
  zoom: number
  getFeatureId: (feature: GeoJSON.Feature) => string | undefined
  visitedIds: Set<string>
  onFeatureClick?: (id: string) => void
}

export function GeoMap({
  geojsonUrl,
  center,
  zoom,
  getFeatureId,
  visitedIds,
  onFeatureClick,
}: GeoMapProps) {
  const geojson = useGeoJson(geojsonUrl)

  const style = useMemo(() => {
    return (feature?: GeoJSON.Feature): PathOptions => {
      const id = feature && getFeatureId(feature)
      return id && visitedIds.has(id) ? VISITED_STYLE : UNVISITED_STYLE
    }
    // visitedIds は毎回新しいSetとして渡される想定のため、そのものを依存にする
    // (中身が変わったのに参照が同じでスタイル更新が漏れることを避ける)
  }, [getFeatureId, visitedIds])

  // onEachFeatureはfeatureごとに1度しか呼ばれない(react-leafletがGeoJSON層を
  // 再構築しない限り更新されない)ため、常に最新のgetFeatureId/onFeatureClickを
  // ref経由で参照し、クロージャが古い値を握ったままにならないようにする。
  const latestHandlers = useRef({ getFeatureId, onFeatureClick })
  latestHandlers.current = { getFeatureId, onFeatureClick }

  const onEachFeature = useMemo(() => {
    return (feature: GeoJSON.Feature, layer: Layer) => {
      layer.on('click', () => {
        const { getFeatureId, onFeatureClick } = latestHandlers.current
        const id = getFeatureId(feature)
        if (id && onFeatureClick) onFeatureClick(id)
      })
    }
  }, [])

  return (
    <MapContainer
      key={geojsonUrl}
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {geojson && (
        <GeoJSON data={geojson} style={style} onEachFeature={onEachFeature} />
      )}
    </MapContainer>
  )
}
