import { useMemo, useRef } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import type { Layer, LatLngExpression, PathOptions } from 'leaflet'
import { useGeoJson } from '../hooks/useGeoJson'
import { MAP_COLORS } from '../lib/mapColors'
import { DARK_TILE_URL, DARK_TILE_ATTRIBUTION } from '../lib/mapTiles'

const VISITED_STYLE: PathOptions = {
  fillColor: MAP_COLORS.accent,
  fillOpacity: 0.55,
  color: MAP_COLORS.accentBorder,
  weight: 1,
}

const UNVISITED_STYLE: PathOptions = {
  fillColor: MAP_COLORS.unvisited,
  fillOpacity: 0.65,
  color: MAP_COLORS.unvisitedBorder,
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
        url={DARK_TILE_URL}
        attribution={DARK_TILE_ATTRIBUTION}
        detectRetina
      />
      {geojson && (
        <GeoJSON data={geojson} style={style} onEachFeature={onEachFeature} />
      )}
    </MapContainer>
  )
}
