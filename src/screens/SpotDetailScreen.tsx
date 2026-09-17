import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { deleteSpot, getSpotDetail, type SpotDetail } from '../lib/records'
import { formatLocationLabel } from '../lib/locationLabel'
import { BackLink } from '../components/BackLink'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useToast } from '../hooks/useToast'
import './SpotDetailScreen.css'

function locationText(latitude: number | null, longitude: number | null) {
  if (latitude === null || longitude === null) return '未取得'
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
}

export function SpotDetailScreen() {
  const { spotId } = useParams<{ spotId: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [detail, setDetail] = useState<SpotDetail | null>()
  const [notFound, setNotFound] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

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

  const handleDelete = async () => {
    setConfirmOpen(false)
    if (!spotId) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteSpot(spotId)
      showToast('削除しました')
      navigate(backLink)
    } catch {
      setDeleteError('削除に失敗しました。時間をおいて再度お試しください。')
      setDeleting(false)
    }
  }

  return (
    <div className="spot-detail">
      <div className="spot-detail__header">
        <BackLink to={backLink} label="戻る" />
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
            {detail.spot.tags.length > 0 && (
              <div className="spot-detail__tags">
                {detail.spot.tags.map((tag) => (
                  <span key={tag} className="spot-detail__tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
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
              loading="lazy"
              className="spot-detail__photo"
            />
          ))}
        </div>
      )}

      {detail && <p className="spot-detail__diary">{detail.spot.diaryText}</p>}

      {detail && (
        <div className="spot-detail__danger-zone">
          <button
            type="button"
            className="spot-detail__delete"
            onClick={() => setConfirmOpen(true)}
            disabled={deleting}
          >
            <Trash2 size={14} strokeWidth={1.5} />
            {deleting ? '削除中…' : 'この記録を削除'}
          </button>
          {deleteError && <p className="spot-detail__delete-error">{deleteError}</p>}
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        message="この記録を削除しますか?この操作は取り消せません。"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
