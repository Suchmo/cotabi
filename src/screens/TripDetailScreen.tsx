import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getTripWithSpots, type SpotWithThumbnail } from '../lib/records'
import { formatLocationLabel } from '../lib/locationLabel'
import './TripDetailScreen.css'

type TripDetail = {
  title: string
  countryCode: string
  prefectureCode: string | null
  spots: SpotWithThumbnail[]
}

function dateRangeLabel(spots: SpotWithThumbnail[]): string {
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

  return (
    <div className="trip-detail">
      <div className="trip-detail__header">
        <Link to="/map">← マップに戻る</Link>
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
              <span className="trip-detail__timeline-name">{spot.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
