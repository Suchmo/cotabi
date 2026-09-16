import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getTripWithSpots } from '../lib/records'
import type { Spot } from '../types/models'
import './TripSpotListScreen.css'

export function TripSpotListScreen() {
  const { tripId } = useParams<{ tripId: string }>()
  const [trip, setTrip] = useState<{ title: string; spots: Spot[] } | null>()
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
    <div className="trip-spot-list">
      <p>
        <Link to="/map">← マップに戻る</Link>
      </p>
      {notFound && <p>旅行が見つかりませんでした。</p>}
      {!notFound && !trip && <p>読み込み中…</p>}
      {trip && (
        <>
          <h1>{trip.title}(仮画面)</h1>
          {trip.spots.length === 0 && <p>この旅行にはまだスポットがありません。</p>}
          {trip.spots.map((spot) => (
            <div key={spot.id} className="trip-spot-list__item">
              <h3>{spot.name}</h3>
              <p className="trip-spot-list__meta">
                {spot.visitedAt} ・ {spot.recordedByEmail ?? spot.recordedBy}
              </p>
              <p className="trip-spot-list__diary">{spot.diaryText}</p>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
