import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { BackLink } from '../components/BackLink'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { WishlistMap } from '../components/WishlistMap'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { searchPlaces, type PlaceResult } from '../lib/nominatim'
import { createWish, deleteWish, listWishes } from '../lib/wishes'
import { formatLocationLabel } from '../lib/locationLabel'
import type { Wish } from '../types/models'
import './WishlistScreen.css'

const PLACE_SEARCH_DEBOUNCE_MS = 600

function wishLocationLabel(wish: { countryCode: string | null; prefectureCode: string | null }) {
  return wish.countryCode ? formatLocationLabel(wish.countryCode, wish.prefectureCode) : null
}

export function WishlistScreen() {
  const { user } = useAuth()
  const { showToast } = useToast()

  const [wishes, setWishes] = useState<Wish[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [confirmTargetId, setConfirmTargetId] = useState<string | null>(null)

  const [placeQuery, setPlaceQuery] = useState('')
  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([])
  const [placeSearching, setPlaceSearching] = useState(false)
  const [placeError, setPlaceError] = useState<string | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null)

  const [placeName, setPlaceName] = useState('')
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const loadWishes = () => {
    setLoadError(null)
    listWishes()
      .then(setWishes)
      .catch(() => setLoadError('読み込みに失敗しました。'))
  }

  useEffect(() => {
    loadWishes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 既存のスポット位置検索(SpotFields)と同じ、Nominatim利用規約に沿った
  // デバウンス済み検索。場所を選択済みの間は再検索しない。
  useEffect(() => {
    if (selectedPlace || placeQuery.trim().length < 2) {
      setPlaceResults([])
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setPlaceSearching(true)
      setPlaceError(null)
      try {
        const results = await searchPlaces(placeQuery, controller.signal)
        setPlaceResults(results)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setPlaceError('検索に失敗しました。')
        }
      } finally {
        setPlaceSearching(false)
      }
    }, PLACE_SEARCH_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [placeQuery, selectedPlace])

  const handleSelectPlace = (place: PlaceResult) => {
    setSelectedPlace(place)
    setPlaceQuery(place.displayName)
    setPlaceResults([])
    setPlaceName(place.displayName.split(',')[0].trim())
  }

  const handleClearSelection = () => {
    setSelectedPlace(null)
    setPlaceQuery('')
    setPlaceName('')
  }

  const resetForm = () => {
    setShowAddForm(false)
    setSelectedPlace(null)
    setPlaceQuery('')
    setPlaceName('')
    setMemo('')
    setFormError(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !selectedPlace) return
    if (!placeName.trim()) {
      setFormError('場所名を入力してください。')
      return
    }

    setSaving(true)
    setFormError(null)
    try {
      await createWish({
        placeName: placeName.trim(),
        countryCode: selectedPlace.countryCode,
        prefectureCode: selectedPlace.prefectureCode,
        latitude: selectedPlace.lat,
        longitude: selectedPlace.lon,
        memo,
        userId: user.uid,
        userEmail: user.email,
      })
      setWishes(await listWishes())
      resetForm()
      showToast('ウィッシュリストに追加しました')
    } catch {
      setFormError('追加に失敗しました。時間をおいて再度お試しください。')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setConfirmTargetId(null)
    setDeletingId(id)
    setDeleteError(null)
    try {
      await deleteWish(id)
      setWishes((prev) => (prev ? prev.filter((w) => w.id !== id) : prev))
      showToast('削除しました')
    } catch {
      setDeleteError('削除に失敗しました。時間をおいて再度お試しください。')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="wishlist-screen">
      <div className="wishlist-screen__header">
        <BackLink to="/map" label="マップに戻る" />
        <h1>ウィッシュリスト</h1>
      </div>

      <div className="wishlist-screen__map-area">
        <WishlistMap wishes={wishes ?? []} />
      </div>

      <button
        type="button"
        className="wishlist-screen__add-toggle"
        onClick={() => (showAddForm ? resetForm() : setShowAddForm(true))}
      >
        <Plus size={16} strokeWidth={1.5} />
        {showAddForm ? '閉じる' : '行きたい場所を追加'}
      </button>

      {/* ブラウザ標準の必須項目バリデーション吹き出しはダークテーマと
          見た目が合わないため、noValidateで無効化し、handleSubmitでの
          チェック+.wishlist-screen__errorでの表示に統一する。 */}
      {showAddForm && (
        <form className="wishlist-screen__form" onSubmit={handleSubmit} noValidate>
          <label>
            場所を検索
            <input
              type="text"
              placeholder="場所を検索(例: サグラダファミリア)"
              value={placeQuery}
              disabled={!!selectedPlace}
              onChange={(e) => setPlaceQuery(e.target.value)}
            />
          </label>

          {selectedPlace ? (
            <button type="button" onClick={handleClearSelection}>
              検索し直す
            </button>
          ) : (
            <>
              {placeSearching && <p className="wishlist-screen__status">検索中…</p>}
              {placeError && <p className="wishlist-screen__error">{placeError}</p>}
              {placeResults.length > 0 && (
                <ul className="wishlist-screen__place-results">
                  {placeResults.map((place) => (
                    <li key={`${place.lat},${place.lon}`}>
                      <button type="button" onClick={() => handleSelectPlace(place)}>
                        {place.displayName}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
          <p className="wishlist-screen__attribution">位置情報検索: OpenStreetMap Nominatim</p>

          {selectedPlace && (
            <>
              <label>
                場所名
                <input
                  required
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                />
              </label>
              <p className="wishlist-screen__status">
                {wishLocationLabel(selectedPlace) ?? '国・地域は未設定'} ・{' '}
                {selectedPlace.lat.toFixed(5)}, {selectedPlace.lon.toFixed(5)}
              </p>
              <label>
                メモ(任意)
                <textarea value={memo} onChange={(e) => setMemo(e.target.value)} />
              </label>
              {formError && <p className="wishlist-screen__error">{formError}</p>}
              <button type="submit" disabled={saving || !placeName.trim()}>
                {saving ? '追加中…' : '追加する'}
              </button>
            </>
          )}
        </form>
      )}

      <div className="wishlist-screen__list">
        {wishes === null && !loadError && (
          <p className="wishlist-screen__status">読み込み中…</p>
        )}
        {loadError && (
          <div className="wishlist-screen__load-error">
            <p className="wishlist-screen__error">{loadError}</p>
            <button type="button" onClick={loadWishes}>
              再試行
            </button>
          </div>
        )}
        {wishes?.length === 0 && (
          <p className="wishlist-screen__status">まだ登録がありません。</p>
        )}
        {deleteError && <p className="wishlist-screen__error">{deleteError}</p>}
        {wishes?.map((wish) => (
          <div key={wish.id} className="wishlist-screen__item">
            <div className="wishlist-screen__item-body">
              <h3>{wish.placeName}</h3>
              {wishLocationLabel(wish) && (
                <p className="wishlist-screen__meta">{wishLocationLabel(wish)}</p>
              )}
              {wish.memo && <p className="wishlist-screen__memo">{wish.memo}</p>}
            </div>
            <button
              type="button"
              className="wishlist-screen__delete"
              onClick={() => setConfirmTargetId(wish.id)}
              disabled={deletingId === wish.id}
              aria-label="削除"
            >
              <Trash2 size={16} strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={confirmTargetId !== null}
        message="この項目をウィッシュリストから削除しますか?この操作は取り消せません。"
        onConfirm={() => confirmTargetId && handleDelete(confirmTargetId)}
        onCancel={() => setConfirmTargetId(null)}
      />
    </div>
  )
}
