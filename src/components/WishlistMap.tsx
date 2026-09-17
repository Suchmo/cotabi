import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import { LIGHT_TILE_URL, LIGHT_TILE_ATTRIBUTION } from '../lib/mapTiles'
import { REGION_CENTER, REGION_MAX_BOUNDS, REGION_MIN_ZOOM, REGION_ZOOM } from '../lib/regionConfig'
import { wishIcon } from '../lib/wishIcon'
import type { Wish } from '../types/models'
import './WishlistMap.css'

type WishlistMapProps = {
  wishes: Wish[]
}

export function WishlistMap({ wishes }: WishlistMapProps) {
  return (
    <MapContainer
      center={REGION_CENTER.world as LatLngExpression}
      zoom={REGION_ZOOM.world}
      minZoom={REGION_MIN_ZOOM.world}
      maxBounds={REGION_MAX_BOUNDS.world}
      maxBoundsViscosity={1.0}
      zoomControl={false}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer url={LIGHT_TILE_URL} attribution={LIGHT_TILE_ATTRIBUTION} detectRetina />
      {wishes.map((wish) => (
        <Marker key={wish.id} position={[wish.latitude, wish.longitude]} icon={wishIcon}>
          <Popup>
            <strong>{wish.placeName}</strong>
            {wish.memo && <p>{wish.memo}</p>}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
