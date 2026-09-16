import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { createTripAndSpot } from '../lib/records'
import { uploadPhotosForSpot } from '../lib/photos'
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
  const [photos, setPhotos] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isJapan = countryCode === JAPAN_COUNTRY_CODE

  const previewUrls = usePhotoPreviews(photos)

  const addPhotos = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const fileArray = Array.from(files)
    setPhotos((prev) => [...prev, ...fileArray])
    e.target.value = ''
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSubmitting(true)
    setError(null)
    try {
      const { spotId } = await createTripAndSpot({
        tripTitle,
        countryCode,
        prefectureCode: isJapan && prefectureCode ? prefectureCode : null,
        spotName,
        visitedAt,
        diaryText,
        userId: user.uid,
        userEmail: user.email,
      })
      if (photos.length > 0) {
        await uploadPhotosForSpot(spotId, photos)
      }
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

        <div className="record-form__photos">
          <span className="record-form__photos-label">写真</span>
          {previewUrls.length > 0 && (
            <div className="record-form__photo-grid">
              {previewUrls.map((url, i) => (
                <div key={url} className="record-form__photo-thumb">
                  <img src={url} alt="" />
                  <button type="button" onClick={() => removePhoto(i)}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="record-form__photo-buttons">
            <label className="record-form__photo-button">
              アルバムから選択
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={addPhotos}
                hidden
              />
            </label>
            <label className="record-form__photo-button">
              その場で撮影
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={addPhotos}
                hidden
              />
            </label>
          </div>
        </div>

        {error && <p className="record-form__error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? '保存中…' : '保存する'}
        </button>
      </form>
    </div>
  )
}

function usePhotoPreviews(files: File[]): string[] {
  const [urls, setUrls] = useState<string[]>([])

  useEffect(() => {
    const nextUrls = files.map((file) => URL.createObjectURL(file))
    setUrls(nextUrls)
    return () => {
      nextUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [files])

  return urls
}
