import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { createTripAndSpot } from '../lib/records'
import { COUNTRIES } from '../lib/countries'
import { JAPAN_COUNTRY_CODE, JAPAN_PREFECTURES } from '../lib/japanPrefectures'
import './RecordFormScreen.css'

function todayAsDateInputValue() {
  return new Date().toISOString().slice(0, 10)
}

export function RecordFormScreen() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [tripTitle, setTripTitle] = useState('')
  const [countryCode, setCountryCode] = useState(JAPAN_COUNTRY_CODE)
  const [prefectureCode, setPrefectureCode] = useState('')
  const [spotName, setSpotName] = useState('')
  const [visitedAt, setVisitedAt] = useState(todayAsDateInputValue())
  const [diaryText, setDiaryText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isJapan = countryCode === JAPAN_COUNTRY_CODE

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSubmitting(true)
    setError(null)
    try {
      await createTripAndSpot({
        tripTitle,
        countryCode,
        prefectureCode: isJapan && prefectureCode ? prefectureCode : null,
        spotName,
        visitedAt,
        diaryText,
        userId: user.uid,
        userEmail: user.email,
      })
      navigate('/records')
    } catch {
      setError('保存に失敗しました。時間をおいて再度お試しください。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="record-form">
      <h1>記録を作成</h1>
      <form onSubmit={handleSubmit}>
        <label>
          旅行名
          <input
            required
            value={tripTitle}
            onChange={(e) => setTripTitle(e.target.value)}
          />
        </label>
        <label>
          国
          <select
            value={countryCode}
            onChange={(e) => {
              setCountryCode(e.target.value)
              setPrefectureCode('')
            }}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        {isJapan && (
          <label>
            都道府県
            <select
              value={prefectureCode}
              onChange={(e) => setPrefectureCode(e.target.value)}
            >
              <option value="">(未選択)</option>
              {JAPAN_PREFECTURES.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          スポット名
          <input
            required
            value={spotName}
            onChange={(e) => setSpotName(e.target.value)}
          />
        </label>
        <label>
          日付
          <input
            type="date"
            required
            value={visitedAt}
            onChange={(e) => setVisitedAt(e.target.value)}
          />
        </label>
        <label>
          日記文章
          <textarea
            value={diaryText}
            onChange={(e) => setDiaryText(e.target.value)}
          />
        </label>
        {error && <p className="record-form__error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? '保存中…' : '保存する'}
        </button>
      </form>
    </div>
  )
}
