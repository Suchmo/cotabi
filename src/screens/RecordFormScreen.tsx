import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { addSpotToTrip, createTripWithSpots, listTrips } from '../lib/records'
import { uploadPhotosForSpot } from '../lib/photos'
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
    if (mode === 'existing-trip' && !selectedTripId) return

    setSubmitting(true)
    setError(null)
    try {
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

        await Promise.all(
          spotBlocks.map((block, i) =>
            block.photos.length > 0
              ? uploadPhotosForSpot(spotIds[i], block.photos)
              : Promise.resolve(),
          ),
        )
      } else {
        const { spotId } = await addSpotToTrip({
          tripId: selectedTripId,
          ...toSpotInput(existingSpot),
          userId: user.uid,
          userEmail: user.email,
        })
        if (existingSpot.photos.length > 0) {
          await uploadPhotosForSpot(spotId, existingSpot.photos)
        }
      }
      showToast('保存しました')
      navigate('/records')
    } catch {
      setError('保存に失敗しました。時間をおいて再度お試しください。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="record-form">
      <form onSubmit={handleSubmit} className="record-form__form">
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
