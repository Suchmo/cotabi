import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useBeforeUnload, useBlocker, useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { addSpotToTrip, createTripWithSpots, listTrips } from '../lib/records'
import { uploadPhotosForSpot } from '../lib/photos'
import { isFullySynced } from '../lib/syncStatus'
import {
  SpotFields,
  createEmptySpotFieldsValue,
  type SpotFieldsValue,
} from '../components/SpotFields'
import { JAPAN_COUNTRY_CODE } from '../lib/japanPrefectures'
import type { Trip } from '../types/models'
import './RecordFormScreen.css'

type Mode = 'new-trip' | 'existing-trip'

type SpotBlock = SpotFieldsValue & { id: string }

const UNSAVED_CHANGES_MESSAGE = '入力内容が失われますが移動しますか?'
// 長めの案内文はデフォルトの2.5秒では読み切れないことがあるため、
// 一定の長さを超えるメッセージは表示時間を延ばす。
const LONG_TOAST_MS = 4500

function todayAsDateInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function toSpotInput(block: SpotFieldsValue) {
  const isJapan = block.countryCode === JAPAN_COUNTRY_CODE
  return {
    countryCode: block.countryCode,
    prefectureCode: isJapan && block.prefectureCode ? block.prefectureCode : null,
    spotName: block.spotName,
    visitedAt: block.visitedAt,
    diaryText: block.diaryText,
    latitude: block.location?.lat ?? null,
    longitude: block.location?.lng ?? null,
    tags: block.tags,
  }
}

function isSpotDirty(spot: SpotFieldsValue): boolean {
  return (
    spot.spotName.trim() !== '' ||
    spot.diaryText.trim() !== '' ||
    spot.photos.length > 0 ||
    spot.tags.length > 0 ||
    spot.location !== null
  )
}

function validateSpot(spot: SpotFieldsValue, label: string): string | null {
  if (!spot.spotName.trim()) return `${label}のスポット名を入力してください。`
  if (!spot.visitedAt) return `${label}の日付を入力してください。`
  return null
}

function buildSaveMessage(hasPhotoFailure: boolean, synced: boolean): string {
  if (hasPhotoFailure) {
    return synced
      ? '記録は保存されましたが、一部の写真が保存できませんでした。'
      : '記録は保存されましたが、一部の写真が保存できませんでした(同期待ちの内容もあります。電波の良い場所で自動的に送信されます)。'
  }
  return synced
    ? '保存しました'
    : '保存しました(同期待ち・電波の良い場所で自動的に送信されます)'
}

export function RecordFormScreen() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [mode, setMode] = useState<Mode>('new-trip')
  const [trips, setTrips] = useState<Trip[] | null>(null)
  const [selectedTripId, setSelectedTripId] = useState('')

  const [tripTitle, setTripTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [costYen, setCostYen] = useState('')
  const [spotBlocks, setSpotBlocks] = useState<SpotBlock[]>([
    { id: crypto.randomUUID(), ...createEmptySpotFieldsValue(todayAsDateInputValue()) },
  ])

  const [existingSpot, setExistingSpot] = useState<SpotFieldsValue>(
    createEmptySpotFieldsValue(todayAsDateInputValue()),
  )

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listTrips().then((result) => {
      setTrips(result)
      if (result.length > 0) setSelectedTripId(result[0].id)
    })
  }, [])

  const isDirty =
    mode === 'new-trip'
      ? tripTitle.trim() !== '' ||
        startDate !== '' ||
        endDate !== '' ||
        costYen.trim() !== '' ||
        spotBlocks.some(isSpotDirty)
      : isSpotDirty(existingSpot)

  // 保存に成功した直後は離脱確認をスキップする(navigate('/records')自体が
  // ブロックされてしまうのを防ぐ)ため、レンダーのタイミングに依存しない
  // refで管理する。isDirtyもrefに同期し、ブロック判定関数からは常に最新の
  // 値を読む(useCallbackの依存配列を空にして関数の参照自体は固定するため)。
  const isDirtyRef = useRef(isDirty)
  isDirtyRef.current = isDirty
  const justSavedRef = useRef(false)

  const shouldBlockNavigation = useCallback(
    () => isDirtyRef.current && !justSavedRef.current,
    [],
  )
  const blocker = useBlocker(shouldBlockNavigation)

  useEffect(() => {
    if (blocker.state !== 'blocked') return
    if (window.confirm(UNSAVED_CHANGES_MESSAGE)) {
      window.setTimeout(blocker.proceed, 0)
    } else {
      blocker.reset()
    }
  }, [blocker])

  // 下タブのクリック・ブラウザ/PWAの戻る操作は上のuseBlockerでカバーされるが、
  // タブを閉じる・再読み込みする操作はアプリ内ルーティングを経由しないため、
  // 別途beforeunloadでも警告する。
  useBeforeUnload(
    useCallback((e: BeforeUnloadEvent) => {
      if (isDirtyRef.current && !justSavedRef.current) {
        e.preventDefault()
      }
    }, []),
  )

  const updateSpotBlock = (id: string, patch: Partial<SpotFieldsValue>) => {
    setSpotBlocks((prev) =>
      prev.map((block) => (block.id === id ? { ...block, ...patch } : block)),
    )
  }

  const addSpotBlock = () => {
    setSpotBlocks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        ...createEmptySpotFieldsValue(todayAsDateInputValue()),
      },
    ])
  }

  const removeSpotBlock = (id: string) => {
    setSpotBlocks((prev) =>
      prev.length > 1 ? prev.filter((block) => block.id !== id) : prev,
    )
  }

  const hasExistingTrips = (trips?.length ?? 0) > 0

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return

    // ブラウザ標準の必須項目バリデーション吹き出しはダークテーマと見た目が
    // 合わないため、フォーム側はnoValidateにして無効化し、ここで独自に
    // チェックして.record-form__errorで表示する。
    if (mode === 'new-trip') {
      if (!tripTitle.trim()) {
        setError('旅行名を入力してください。')
        return
      }
      for (let i = 0; i < spotBlocks.length; i++) {
        const spotError = validateSpot(spotBlocks[i], `スポット${i + 1}`)
        if (spotError) {
          setError(spotError)
          return
        }
      }
    } else {
      if (!selectedTripId) {
        setError('旅行を選択してください。')
        return
      }
      const spotError = validateSpot(existingSpot, 'スポット')
      if (spotError) {
        setError(spotError)
        return
      }
    }

    setSubmitting(true)
    setError(null)
    try {
      let hasPhotoFailure = false

      if (mode === 'new-trip') {
        const { spotIds } = await createTripWithSpots({
          tripTitle,
          startDate: startDate || null,
          endDate: endDate || null,
          costYen: costYen.trim() ? Number(costYen) : null,
          spots: spotBlocks.map(toSpotInput),
          userId: user.uid,
          userEmail: user.email,
        })

        // 旅行・スポット自体の保存(上のawait)が成功した後は、写真の
        // アップロードが一部失敗しても「保存に失敗しました」と一律に
        // 表示せず、部分的な成功として区別して伝える。
        const photoResults = await Promise.allSettled(
          spotBlocks.map((block, i) =>
            block.photos.length > 0
              ? uploadPhotosForSpot(spotIds[i], block.photos)
              : Promise.resolve(),
          ),
        )
        hasPhotoFailure = photoResults.some((r) => r.status === 'rejected')
      } else {
        const { spotId } = await addSpotToTrip({
          tripId: selectedTripId,
          ...toSpotInput(existingSpot),
          userId: user.uid,
          userEmail: user.email,
        })
        if (existingSpot.photos.length > 0) {
          hasPhotoFailure = await uploadPhotosForSpot(spotId, existingSpot.photos).then(
            () => false,
            () => true,
          )
        }
      }

      // Firestoreはオフラインでもローカルキャッシュへの書き込みを即座に
      // 成功扱いにするため、waitForPendingWrites()で実際にサーバーへ
      // 届いたかどうかを確認する(電波が悪い間は一定時間で諦めて
      // 「未同期」として案内する。isFullySynced自体が失敗した場合も、
      // 保存自体は成功しているので安全側の「未同期」扱いにとどめる)。
      let synced = true
      try {
        synced = await isFullySynced()
      } catch {
        synced = false
      }

      justSavedRef.current = true
      const message = buildSaveMessage(hasPhotoFailure, synced)
      showToast(message, message.length > 20 ? LONG_TOAST_MS : undefined)
      navigate('/records')
    } catch {
      setError('保存に失敗しました。時間をおいて再度お試しください。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="record-form">
      <form onSubmit={handleSubmit} className="record-form__form" noValidate>
        <div className="record-form__scroll">
          <h1>記録を作成</h1>
          <div className="record-form__mode-toggle">
            <button
              type="button"
              className={mode === 'new-trip' ? 'is-selected' : ''}
              onClick={() => setMode('new-trip')}
            >
              新しい旅行を作る
            </button>
            <button
              type="button"
              className={mode === 'existing-trip' ? 'is-selected' : ''}
              onClick={() => setMode('existing-trip')}
              disabled={!hasExistingTrips}
            >
              既存の旅行に追加
            </button>
          </div>

          {mode === 'new-trip' ? (
            <>
              <label>
                旅行名
                <input
                  required
                  value={tripTitle}
                  onChange={(e) => setTripTitle(e.target.value)}
                />
              </label>
              <div className="record-form__date-range">
                <label>
                  開始日(任意)
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </label>
                <label>
                  終了日(任意)
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </label>
              </div>
              <label>
                費用(円・任意)
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  value={costYen}
                  onChange={(e) => setCostYen(e.target.value)}
                />
              </label>

              {spotBlocks.map((block, index) => (
                <div key={block.id} className="record-form__spot-block">
                  <div className="record-form__spot-block-header">
                    <h3>スポット {index + 1}</h3>
                    {spotBlocks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSpotBlock(block.id)}
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                        削除
                      </button>
                    )}
                  </div>
                  <SpotFields
                    value={block}
                    onChange={(patch) => updateSpotBlock(block.id, patch)}
                  />
                </div>
              ))}

              <button
                type="button"
                className="record-form__add-spot"
                onClick={addSpotBlock}
              >
                <Plus size={16} strokeWidth={1.5} />
                スポットを追加
              </button>
            </>
          ) : (
            <>
              <label>
                旅行を選択
                {trips === null ? (
                  <p className="record-form__location-status">読み込み中…</p>
                ) : trips.length === 0 ? (
                  <p className="record-form__location-status">
                    まだ旅行がありません。「新しい旅行を作る」から始めてください。
                  </p>
                ) : (
                  <select
                    required
                    value={selectedTripId}
                    onChange={(e) => setSelectedTripId(e.target.value)}
                  >
                    {trips.map((trip) => (
                      <option key={trip.id} value={trip.id}>
                        {trip.title}
                      </option>
                    ))}
                  </select>
                )}
              </label>
              <SpotFields
                value={existingSpot}
                onChange={(patch) =>
                  setExistingSpot((prev) => ({ ...prev, ...patch }))
                }
              />
            </>
          )}
        </div>

        <div className="record-form__footer">
          {error && <p className="record-form__error">{error}</p>}
          <button
            type="submit"
            disabled={
              submitting || (mode === 'existing-trip' && !selectedTripId)
            }
          >
            {submitting ? '保存中…' : '保存する'}
          </button>
        </div>
      </form>
    </div>
  )
}
