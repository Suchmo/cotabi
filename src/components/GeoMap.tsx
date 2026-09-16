import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import { useGeoJson } from '../hooks/useGeoJson'

type GeoMapProps = {
  geojsonUrl: string
  center: LatLngExpression
  zoom: number
}

export function GeoMap({ geojsonUrl, center, zoom }: GeoMapProps) {
  const geojson = useGeoJson(geojsonUrl)

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
      {geojson && <GeoJSON data={geojson} />}
    </MapContainer>
  )
}
