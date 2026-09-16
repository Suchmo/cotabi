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

  const addPhotos = (source: string) => (e: ChangeEvent<HTMLInputElement>) => {
    console.log(`[RecordForm] addPhotos onChange fired (source=${source})`, e.target)
    const files = e.target.files
    console.log(`[RecordForm] e.target.files =`, files, 'length =', files?.length)
    if (!files || files.length === 0) {
      console.log('[RecordForm] no files selected, aborting')
      return
    }
    const fileArray = Array.from(files)
    console.log(
      '[RecordForm] files as array:',
      fileArray.map((f) => ({ name: f.name, type: f.type, size: f.size })),
    )
    setPhotos((prev) => {
      const next = [...prev, ...fileArray]
      console.log(
        '[RecordForm] setPhotos updater: prev.length =',
        prev.length,
        '-> next.length =',
        next.length,
      )
      return next
    })
    e.target.value = ''
  }

  const removePhoto = (index: number) => {
    console.log('[RecordForm] removePhoto called for index', index)
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  console.log(
    '[RecordForm] render: photos.length =',
    photos.length,
    'previewUrls.length =',
    previewUrls.length,
  )

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
                onChange={addPhotos('album')}
                hidden
              />
            </label>
            <label className="record-form__photo-button">
              その場で撮影
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={addPhotos('camera')}
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
    console.log(
      '[RecordForm] usePhotoPreviews effect running, files.length =',
      files.length,
    )
    const nextUrls = files.map((file) => URL.createObjectURL(file))
    console.log('[RecordForm] usePhotoPreviews generated urls:', nextUrls)
    setUrls(nextUrls)
    return () => {
      console.log('[RecordForm] usePhotoPreviews cleanup, revoking:', nextUrls)
      nextUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [files])

  return urls
}
