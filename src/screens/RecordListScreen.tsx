import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listSpotsWithTrips, type SpotWithTripTitle } from '../lib/records'
import { COUNTRIES } from '../lib/countries'
import { JAPAN_PREFECTURES } from '../lib/japanPrefectures'
import './RecordListScreen.css'

const countryNameByCode = new Map(COUNTRIES.map((c) => [c.code, c.name]))
const prefectureNameByCode = new Map(
  JAPAN_PREFECTURES.map((p) => [p.code, p.name]),
)

function locationLabel(spot: SpotWithTripTitle) {
  const country = countryNameByCode.get(spot.countryCode) ?? spot.countryCode
  const prefecture = spot.prefectureCode
    ? (prefectureNameByCode.get(spot.prefectureCode) ?? spot.prefectureCode)
    : null
  return prefecture ? `${country} / ${prefecture}` : country
}

export function RecordListScreen() {
  const [spots, setSpots] = useState<SpotWithTripTitle[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listSpotsWithTrips()
      .then(setSpots)
      .catch(() => setError('記録の取得に失敗しました。'))
  }, [])

  return (
    <div className="record-list">
      <h1>記録一覧(仮)</h1>
      <p>
        <Link to="/records/new">+ 新しい記録を作成</Link>
      </p>
      {error && <p>{error}</p>}
      {!error && spots === null && <p>読み込み中…</p>}
      {spots?.length === 0 && <p>まだ記録がありません。</p>}
      {spots?.map((spot) => (
        <div key={spot.id} className="record-list__item">
          <h3>{spot.tripTitle ?? spot.name}</h3>
          <p className="record-list__meta">
            {locationLabel(spot)} ・ {spot.name} ・ {spot.visitedAt} ・{' '}
            {spot.recordedByEmail ?? spot.recordedBy}
          </p>
          <p className="record-list__diary">{spot.diaryText}</p>
        </div>
      ))}
    </div>
  )
}
