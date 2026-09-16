import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getSpotDetail, type SpotDetail } from '../lib/records'
import { formatLocationLabel } from '../lib/locationLabel'
import './SpotDetailScreen.css'

function locationText(latitude: number | null, longitude: number | null) {
  if (latitude === null || longitude === null) return '未取得'
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
}

export function SpotDetailScreen() {
  const { spotId } = useParams<{ spotId: string }>()
  const [detail, setDetail] = useState<SpotDetail | null>()
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!spotId) return
    getSpotDetail(spotId).then((result) => {
      if (!result) {
        setNotFound(true)
        return
      }
      setDetail(result)
    })
  }, [spotId])

  const backLink = detail?.spot.tripId
    ? `/trips/${detail.spot.tripId}`
    : '/records'

  return (
    <div className="spot-detail">
      <div className="spot-detail__header">
        <Link to={backLink}>← 戻る</Link>
        {notFound && <p>スポットが見つかりませんでした。</p>}
        {!notFound && !detail && <p>読み込み中…</p>}
        {detail && (
          <>
            <h1>{detail.spot.name}</h1>
            {detail.tripTitle && (
              <p className="spot-detail__meta">旅行: {detail.tripTitle}</p>
            )}
            <p className="spot-detail__meta">
              {formatLocationLabel(
                detail.spot.countryCode,
                detail.spot.prefectureCode,
              )}{' '}
              ・ {detail.spot.visitedAt}
            </p>
            <p className="spot-detail__meta">
              記録者: {detail.spot.recordedByEmail ?? detail.spot.recordedBy}
            </p>
            <p className="spot-detail__meta">
              位置情報:{' '}
              {locationText(detail.spot.latitude, detail.spot.longitude)}
            </p>
          </>
        )}
      </div>

      {detail && detail.photos.length > 0 && (
        <div className="spot-detail__photo-grid">
          {detail.photos.map((photo) => (
            <img
              key={photo.id}
              src={photo.downloadUrl}
              alt=""
              className="spot-detail__photo"
            />
          ))}
        </div>
      )}

      {detail && <p className="spot-detail__diary">{detail.spot.diaryText}</p>}
    </div>
  )
}
