import { useEffect } from 'react'
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import type { LatLngExpression } from 'leaflet'
import type { LocatedSpot, TripRoute } from '../lib/regionRoutes'
import { MAP_COLORS } from '../lib/mapColors'
import { LIGHT_TILE_URL, LIGHT_TILE_ATTRIBUTION } from '../lib/mapTiles'

type RouteMapProps = {
  center: LatLngExpression
  zoom: number
  boundaryFeature: GeoJSON.Feature | null
  routes: TripRoute[]
  pins: LocatedSpot[]
  onRouteClick: (tripId: string) => void
}

// 選択した国・都道府県の周辺だけをパン・ズームできるようにする。
// 国土の大きさは国ごとに全く異なるため、固定値ではなく境界データから
// そのつど計算する。
function FitToBoundary({ feature }: { feature: GeoJSON.Feature | null }) {
  const map = useMap()

  useEffect(() => {
    if (!feature) return
    const bounds = L.geoJSON(feature).getBounds()
    if (!bounds.isValid()) return

    map.fitBounds(bounds, { padding: [24, 24] })

    const padded = bounds.pad(0.6)
    map.setMaxBounds(padded)
    map.setMinZoom(map.getBoundsZoom(padded))
  }, [feature, map])

  return null
}

export function RouteMap({
  center,
  zoom,
  boundaryFeature,
  routes,
  pins,
  onRouteClick,
}: RouteMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      maxZoom={16}
      maxBoundsViscosity={1.0}
      zoomControl={false}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url={LIGHT_TILE_URL}
        attribution={LIGHT_TILE_ATTRIBUTION}
        detectRetina
      />
      {boundaryFeature && (
        <GeoJSON
          data={boundaryFeature}
          style={{ color: MAP_COLORS.boundaryOutline, weight: 1, fillOpacity: 0.05 }}
          interactive={false}
        />
      )}
      <FitToBoundary feature={boundaryFeature} />
      {routes.map((route) => {
        const positions = route.spots.map(
          (s) => [s.latitude, s.longitude] as LatLngExpression,
        )
        if (positions.length >= 2) {
          return (
            <Polyline
              key={route.tripId}
              positions={positions}
              pathOptions={{ color: route.color, weight: 4 }}
              eventHandlers={{ click: () => onRouteClick(route.tripId) }}
            />
          )
        }
        return (
          <CircleMarker
            key={route.tripId}
            center={positions[0]}
            radius={8}
            pathOptions={{
              color: route.color,
              fillColor: route.color,
              fillOpacity: 0.8,
            }}
            eventHandlers={{ click: () => onRouteClick(route.tripId) }}
          />
        )
      })}
      {pins.map((spot) => (
        <Marker key={spot.id} position={[spot.latitude, spot.longitude]}>
          <Popup>{spot.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
