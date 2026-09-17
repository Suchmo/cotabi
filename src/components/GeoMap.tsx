import { useMemo, useRef } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import type {
  LatLngBoundsExpression,
  Layer,
  LatLngExpression,
  PathOptions,
} from 'leaflet'
import { useGeoJson } from '../hooks/useGeoJson'
import { MAP_COLORS } from '../lib/mapColors'
import { LIGHT_TILE_URL, LIGHT_TILE_ATTRIBUTION } from '../lib/mapTiles'
import './GeoMap.css'

const VISITED_STYLE: PathOptions = {
  fillColor: MAP_COLORS.accent,
  fillOpacity: 0.55,
  color: MAP_COLORS.accentBorder,
  weight: 1,
}

const UNVISITED_STYLE: PathOptions = {
  fillColor: MAP_COLORS.unvisited,
  fillOpacity: 0.35,
  color: MAP_COLORS.unvisitedBorder,
  weight: 1,
}

type GeoMapProps = {
  geojsonUrl: string
  center: LatLngExpression
  zoom: number
  minZoom?: number
  maxZoom?: number
  maxBounds?: LatLngBoundsExpression
  getFeatureId: (feature: GeoJSON.Feature) => string | undefined
  visitedIds: Set<string>
  onFeatureClick?: (id: string) => void
  // featureFilterで表示対象を絞り込む場合、変更時にMapContainerを作り直す
  // 必要があるため、その判定に使う文字列(例: 選択中の大陸名)
  filterKey?: string
  featureFilter?: (feature: GeoJSON.Feature) => boolean
}

export function GeoMap({
  geojsonUrl,
  center,
  zoom,
  minZoom,
  maxZoom,
  maxBounds,
  getFeatureId,
  visitedIds,
  onFeatureClick,
  filterKey,
  featureFilter,
}: GeoMapProps) {
  const { data: geojson, loading, error, retry } = useGeoJson(geojsonUrl)

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
    <div className="geo-map">
      <MapContainer
        key={`${geojsonUrl}:${filterKey ?? ''}`}
        center={center}
        zoom={zoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        maxBounds={maxBounds}
        maxBoundsViscosity={1.0}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url={LIGHT_TILE_URL}
          attribution={LIGHT_TILE_ATTRIBUTION}
          detectRetina
        />
        {geojson && (
          <GeoJSON
            data={geojson}
            style={style}
            onEachFeature={onEachFeature}
            filter={featureFilter}
          />
        )}
      </MapContainer>

      {(loading || error) && (
        <div className="geo-map__overlay">
          {loading && <p className="geo-map__overlay-text">読み込み中…</p>}
          {error && (
            <>
              <p className="geo-map__overlay-text">
                地図データの読み込みに失敗しました。
              </p>
              <button type="button" className="geo-map__retry" onClick={retry}>
                再試行
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
