import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import {
  deleteTrip,
  getTripWithSpots,
  updateTripCost,
  type SpotWithPhotos,
} from '../lib/records'
import { formatDistinctLocationsLabel } from '../lib/locationLabel'
import { BackLink } from '../components/BackLink'
import { useToast } from '../hooks/useToast'
import './TripDetailScreen.css'

type TripDetail = {
  title: string
  countryCode: string
  prefectureCode: string | null
  costYen: number | null
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
  const navigate = useNavigate()
  const [trip, setTrip] = useState<TripDetail | null>()
  const [notFound, setNotFound] = useState(false)
  const [view, setView] = useState<ViewMode>('timeline')
  const { showToast } = useToast()

  const [editingCost, setEditingCost] = useState(false)
  const [costInput, setCostInput] = useState('')
  const [savingCost, setSavingCost] = useState(false)

  const [deletingTrip, setDeletingTrip] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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

  const startEditingCost = () => {
    setCostInput(trip?.costYen != null ? String(trip.costYen) : '')
    setEditingCost(true)
  }

  const handleSaveCost = async (e: FormEvent) => {
    e.preventDefault()
    if (!tripId) return
    const costYen = costInput.trim() ? Number(costInput) : null

    setSavingCost(true)
    try {
      await updateTripCost(tripId, costYen)
      setTrip((prev) => (prev ? { ...prev, costYen } : prev))
      setEditingCost(false)
      showToast('費用を保存しました')
    } finally {
      setSavingCost(false)
    }
  }

  const handleDeleteTrip = async () => {
    if (!tripId || !trip) return
    const spotCount = trip.spots.length
    const confirmMessage =
      spotCount > 0
        ? `この旅行と、含まれる全スポット(${spotCount}件)・写真をすべて削除します。この操作は取り消せません。`
        : 'この旅行を削除します。この操作は取り消せません。'
    if (!window.confirm(confirmMessage)) return

    setDeletingTrip(true)
    setDeleteError(null)
    try {
      await deleteTrip(tripId)
      showToast('旅行を削除しました')
      navigate('/records')
    } catch {
      setDeleteError('削除に失敗しました。時間をおいて再度お試しください。')
      setDeletingTrip(false)
    }
  }

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
              {formatDistinctLocationsLabel(trip.spots)} ・{' '}
              {dateRangeLabel(trip.spots)}
            </p>

            {!editingCost && (
              <div className="trip-detail__cost">
                {trip.costYen != null && (
                  <span className="trip-detail__cost-value">
                    費用: {trip.costYen.toLocaleString()}円
                  </span>
                )}
                <button
                  type="button"
                  className="trip-detail__cost-edit"
                  onClick={startEditingCost}
                >
                  <Pencil size={12} strokeWidth={1.5} />
                  {trip.costYen != null ? '編集' : '費用を入力'}
                </button>
              </div>
            )}

            {editingCost && (
              <form className="trip-detail__cost-form" onSubmit={handleSaveCost}>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  placeholder="金額(円)"
                  value={costInput}
                  onChange={(e) => setCostInput(e.target.value)}
                  autoFocus
                />
                <button type="submit" disabled={savingCost}>
                  {savingCost ? '保存中…' : '保存'}
                </button>
                <button type="button" onClick={() => setEditingCost(false)}>
                  キャンセル
                </button>
              </form>
            )}
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
                  <span className="trip-detail__timeline-body">
                    <span className="trip-detail__timeline-name">
                      {spot.name}
                    </span>
                    {spot.tags.length > 0 && (
                      <span className="trip-detail__timeline-tags">
                        {spot.tags.map((tag) => (
                          <span key={tag} className="trip-detail__timeline-tag">
                            {tag}
                          </span>
                        ))}
                      </span>
                    )}
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

      {trip && (
        <div className="trip-detail__danger-zone">
          <button
            type="button"
            className="trip-detail__delete-trip"
            onClick={handleDeleteTrip}
            disabled={deletingTrip}
          >
            <Trash2 size={14} strokeWidth={1.5} />
            {deletingTrip ? '削除中…' : '旅行を削除'}
          </button>
          {deleteError && <p className="trip-detail__delete-error">{deleteError}</p>}
        </div>
      )}
    </div>
  )
}
