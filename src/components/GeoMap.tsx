import { useMemo } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import type { LatLngExpression, PathOptions } from 'leaflet'
import { useGeoJson } from '../hooks/useGeoJson'

const VISITED_STYLE: PathOptions = {
  fillColor: '#2563eb',
  fillOpacity: 0.55,
  color: '#1d4ed8',
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
}

export function GeoMap({
  geojsonUrl,
  center,
  zoom,
  getFeatureId,
  visitedIds,
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
      {geojson && <GeoJSON data={geojson} style={style} />}
    </MapContainer>
  )
}
