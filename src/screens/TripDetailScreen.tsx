import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getTripWithSpots, type SpotWithPhotos } from '../lib/records'
import { formatLocationLabel } from '../lib/locationLabel'
import { BackLink } from '../components/BackLink'
import './TripDetailScreen.css'

type TripDetail = {
  title: string
  countryCode: string
  prefectureCode: string | null
  spots: SpotWithPhotos[]
}

type ViewMode = 'timeline' | 'album'

function dateRangeLabel(spots: SpotWithPhotos[]): string {
  if (spots.length === 0) return '記録なし'
  const dates = spots.map((s) => s.visitedAt).sort()
  const first = dates[0]
  const last = dates[dates.length - 1]
  return first === last ? first : `${first} 〜 ${last}`
}

export function TripDetailScreen() {
  const { tripId } = useParams<{ tripId: string }>()
  const [trip, setTrip] = useState<TripDetail | null>()
  const [notFound, setNotFound] = useState(false)
  const [view, setView] = useState<ViewMode>('timeline')

  useEffect(() => {
    if (!tripId) return
    getTripWithSpots(tripId).then((result) => {
      if (!result) {
        setNotFound(true)
        return
      }
      setTrip(result)
    })
  }, [tripId])

  const photoCount =
    trip?.spots.reduce((sum, spot) => sum + spot.photos.length, 0) ?? 0

  return (
    <div className="trip-detail">
      <div className="trip-detail__header">
        <BackLink to="/map" label="マップに戻る" />
        {notFound && <p>旅行が見つかりませんでした。</p>}
        {!notFound && !trip && <p>読み込み中…</p>}
        {trip && (
          <>
            <h1>{trip.title}</h1>
            <p className="trip-detail__meta">
              {formatLocationLabel(trip.countryCode, trip.prefectureCode)} ・{' '}
              {dateRangeLabel(trip.spots)}
            </p>
          </>
        )}
      </div>

      {trip && trip.spots.length === 0 && (
        <p>この旅行にはまだスポットがありません。</p>
      )}

      {trip && trip.spots.length > 0 && (
        <>
          <div className="trip-detail__view-toggle">
            <button
              type="button"
              className={view === 'timeline' ? 'is-selected' : ''}
              onClick={() => setView('timeline')}
            >
              タイムライン
            </button>
            <button
              type="button"
              className={view === 'album' ? 'is-selected' : ''}
              onClick={() => setView('album')}
            >
              アルバム
            </button>
          </div>

          {view === 'timeline' && (
            <div className="trip-detail__timeline">
              {trip.spots.map((spot) => (
                <Link
                  key={spot.id}
                  to={`/spots/${spot.id}`}
                  className="trip-detail__timeline-item"
                >
                  <span className="trip-detail__timeline-date">
                    {spot.visitedAt}
                  </span>
                  {spot.thumbnailUrl ? (
                    <img
                      src={spot.thumbnailUrl}
                      alt=""
                      className="trip-detail__timeline-thumb"
                    />
                  ) : (
                    <span className="trip-detail__timeline-thumb" />
                  )}
                  <span className="trip-detail__timeline-name">
                    {spot.name}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {view === 'album' &&
            (photoCount === 0 ? (
              <p>この旅行にはまだ写真がありません。</p>
            ) : (
              <div className="trip-detail__album-grid">
                {trip.spots.flatMap((spot) =>
                  spot.photos.map((photo) => (
                    <Link
                      key={photo.id}
                      to={`/spots/${spot.id}`}
                      className="trip-detail__album-item"
                    >
                      <img src={photo.downloadUrl} alt="" />
                    </Link>
                  )),
                )}
              </div>
            ))}
        </>
      )}
    </div>
  )
}
