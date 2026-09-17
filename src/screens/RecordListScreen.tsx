import { useEffect, useMemo, useState } from 'react'
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

function dateRangeLabel(spots: SpotWithTripTitle[]): string {
  const dates = spots.map((s) => s.visitedAt).sort()
  const first = dates[0]
  const last = dates[dates.length - 1]
  return first === last ? first : `${first} 〜 ${last}`
}

type TripGroup = {
  tripId: string
  tripTitle: string
  startDate: string
  dateRangeLabel: string
  spots: SpotWithTripTitle[]
}

function groupSpots(spots: SpotWithTripTitle[]): {
  tripGroups: TripGroup[]
  standalone: SpotWithTripTitle[]
} {
  const byTripId = new Map<string, SpotWithTripTitle[]>()
  const standalone: SpotWithTripTitle[] = []

  for (const spot of spots) {
    if (!spot.tripId) {
      standalone.push(spot)
      continue
    }
    const list = byTripId.get(spot.tripId)
    if (list) list.push(spot)
    else byTripId.set(spot.tripId, [spot])
  }

  const tripGroups = Array.from(byTripId.entries())
    .map(([tripId, groupSpots]) => {
      const sorted = groupSpots
        .slice()
        .sort((a, b) => a.visitedAt.localeCompare(b.visitedAt))
      return {
        tripId,
        tripTitle: groupSpots[0].tripTitle ?? '(旅行)',
        startDate: sorted[0].visitedAt,
        dateRangeLabel: dateRangeLabel(sorted),
        spots: sorted,
      }
    })
    .sort((a, b) => b.startDate.localeCompare(a.startDate))

  standalone.sort((a, b) => b.visitedAt.localeCompare(a.visitedAt))

  return { tripGroups, standalone }
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

  const { tripGroups, standalone } = useMemo(
    () => groupSpots(spots ?? []),
    [spots],
  )

  return (
    <div className="record-list">
      <h1>記録一覧</h1>
      <p>
        <Link to="/records/new" className="record-list__new-link">
          <Plus size={16} strokeWidth={1.5} />
          新しい記録を作成
        </Link>
      </p>
      {error && <p>{error}</p>}
      {!error && spots === null && <p>読み込み中…</p>}
      {spots?.length === 0 && <p>まだ記録がありません。</p>}

      {tripGroups.map((group) => (
        <div key={group.tripId} className="record-list__group">
          <Link
            to={`/trips/${group.tripId}`}
            className="record-list__group-heading"
          >
            {group.tripTitle}({group.dateRangeLabel})
          </Link>
          {group.spots.map((spot) => (
            <SpotCard
              key={spot.id}
              spot={spot}
              photos={photosBySpotId.get(spot.id) ?? []}
            />
          ))}
        </div>
      ))}

      {standalone.length > 0 && (
        <div className="record-list__group">
          <h2 className="record-list__group-heading record-list__group-heading--plain">
            単発の記録
          </h2>
          {standalone.map((spot) => (
            <SpotCard
              key={spot.id}
              spot={spot}
              photos={photosBySpotId.get(spot.id) ?? []}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SpotCard({
  spot,
  photos,
}: {
  spot: SpotWithTripTitle
  photos: Photo[]
}) {
  return (
    <Link to={`/spots/${spot.id}`} className="record-list__item">
      <h3>{spot.name}</h3>
      <p className="record-list__meta">
        {locationLabel(spot)} ・ {spot.visitedAt} ・{' '}
        {spot.recordedByEmail ?? spot.recordedBy}
      </p>
      {spot.tags.length > 0 && (
        <div className="record-list__tags">
          {spot.tags.map((tag) => (
            <span key={tag} className="record-list__tag">
              {tag}
            </span>
          ))}
        </div>
      )}
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
    </Link>
  )
}
