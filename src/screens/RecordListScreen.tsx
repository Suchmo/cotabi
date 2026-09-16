import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { listSpotsWithTrips, type SpotWithTripTitle } from '../lib/records'
import { listPhotosBySpotId } from '../lib/photos'
import { formatLocationLabel } from '../lib/locationLabel'
import type { Photo } from '../types/models'
import './RecordListScreen.css'

function locationLabel(spot: SpotWithTripTitle) {
  return formatLocationLabel(spot.countryCode, spot.prefectureCode)
}

export function RecordListScreen() {
  const [spots, setSpots] = useState<SpotWithTripTitle[] | null>(null)
  const [photosBySpotId, setPhotosBySpotId] = useState<Map<string, Photo[]>>(
    new Map(),
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([listSpotsWithTrips(), listPhotosBySpotId()])
      .then(([spots, photos]) => {
        setSpots(spots)
        setPhotosBySpotId(photos)
      })
      .catch(() => setError('記録の取得に失敗しました。'))
  }, [])

  return (
    <div className="record-list">
      <h1>記録一覧(仮)</h1>
      <p>
        <Link to="/records/new" className="record-list__new-link">
          <Plus size={16} strokeWidth={1.5} />
          新しい記録を作成
        </Link>
      </p>
      {error && <p>{error}</p>}
      {!error && spots === null && <p>読み込み中…</p>}
      {spots?.length === 0 && <p>まだ記録がありません。</p>}
      {spots?.map((spot) => {
        const photos = photosBySpotId.get(spot.id) ?? []
        return (
          <div key={spot.id} className="record-list__item">
            <h3>{spot.tripTitle ?? spot.name}</h3>
            <p className="record-list__meta">
              {locationLabel(spot)} ・ {spot.name} ・ {spot.visitedAt} ・{' '}
              {spot.recordedByEmail ?? spot.recordedBy}
            </p>
            {photos.length > 0 && (
              <div className="record-list__photo-grid">
                {photos.map((photo) => (
                  <img
                    key={photo.id}
                    src={photo.downloadUrl}
                    alt=""
                    className="record-list__photo-thumb"
                  />
                ))}
              </div>
            )}
            <p className="record-list__diary">{spot.diaryText}</p>
          </div>
        )
      })}
    </div>
  )
}
