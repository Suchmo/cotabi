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

type RouteMapProps = {
  center: LatLngExpression
  zoom: number
  boundaryFeature: GeoJSON.Feature | null
  routes: TripRoute[]
  pins: LocatedSpot[]
  onRouteClick: (tripId: string) => void
}

function FitToBoundary({ feature }: { feature: GeoJSON.Feature | null }) {
  const map = useMap()

  useEffect(() => {
    if (!feature) return
    const bounds = L.geoJSON(feature).getBounds()
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [24, 24] })
    }
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
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {boundaryFeature && (
        <GeoJSON
          data={boundaryFeature}
          style={{ color: '#9ca3af', weight: 1, fillOpacity: 0.05 }}
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
