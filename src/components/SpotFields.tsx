import { useEffect, useState, type ChangeEvent } from 'react'
import { X, ImagePlus, Camera, MapPin } from 'lucide-react'
import { COUNTRIES } from '../lib/countries'
import { JAPAN_COUNTRY_CODE, JAPAN_PREFECTURES } from '../lib/japanPrefectures'

export type SpotFieldsValue = {
  countryCode: string
  prefectureCode: string
  spotName: string
  visitedAt: string
  diaryText: string
  photos: File[]
  location: { lat: number; lng: number } | null
}

export function createEmptySpotFieldsValue(visitedAt: string): SpotFieldsValue {
  return {
    countryCode: JAPAN_COUNTRY_CODE,
    prefectureCode: '',
    spotName: '',
    visitedAt,
    diaryText: '',
    photos: [],
    location: null,
  }
}

type SpotFieldsProps = {
  value: SpotFieldsValue
  onChange: (patch: Partial<SpotFieldsValue>) => void
}

// 記録作成画面のスポット単位の入力欄(国・都道府県・スポット名・日付・日記・
// 位置情報・写真)。「新しい旅行を作る」では1トリップ内で複数個並べて使い、
// 「既存の旅行に追加」では単体で使う。
export function SpotFields({ value, onChange }: SpotFieldsProps) {
  const [locationError, setLocationError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const previewUrls = usePhotoPreviews(value.photos)

  const isJapan = value.countryCode === JAPAN_COUNTRY_CODE

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('この端末では位置情報を取得できません。')
      return
    }
    setLocating(true)
    setLocationError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        })
        setLocating(false)
      },
      () => {
        setLocationError('位置情報の取得に失敗しました。')
        setLocating(false)
      },
    )
  }

  const addPhotos = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    onChange({ photos: [...value.photos, ...Array.from(files)] })
    e.target.value = ''
  }

  const removePhoto = (index: number) => {
    onChange({ photos: value.photos.filter((_, i) => i !== index) })
  }

  return (
    <>
      <label>
        国
        <select
          value={value.countryCode}
          onChange={(e) =>
            onChange({ countryCode: e.target.value, prefectureCode: '' })
          }
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
            value={value.prefectureCode}
            onChange={(e) => onChange({ prefectureCode: e.target.value })}
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
          value={value.spotName}
          onChange={(e) => onChange({ spotName: e.target.value })}
        />
      </label>
      <label>
        日付
        <input
          type="date"
          required
          value={value.visitedAt}
          onChange={(e) => onChange({ visitedAt: e.target.value })}
        />
      </label>
      <label>
        日記文章
        <textarea
          value={value.diaryText}
          onChange={(e) => onChange({ diaryText: e.target.value })}
        />
      </label>

      <div className="record-form__location">
        <span className="record-form__photos-label">位置情報(任意)</span>
        <p className="record-form__location-status">
          {value.location
            ? `取得済み: ${value.location.lat.toFixed(5)}, ${value.location.lng.toFixed(5)}`
            : '未取得(地図でのルート表示に使われます)'}
        </p>
        <button type="button" onClick={captureLocation} disabled={locating}>
          <MapPin size={14} strokeWidth={1.5} />
          {locating ? '取得中…' : '現在地を取得'}
        </button>
        {locationError && <p className="record-form__error">{locationError}</p>}
      </div>

      <div className="record-form__photos">
        <span className="record-form__photos-label">写真</span>
        {previewUrls.length > 0 && (
          <div className="record-form__photo-grid">
            {previewUrls.map((url, i) => (
              <div key={url} className="record-form__photo-thumb">
                <img src={url} alt="" />
                <button type="button" onClick={() => removePhoto(i)}>
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="record-form__photo-buttons">
          <label className="record-form__photo-button">
            <ImagePlus size={16} strokeWidth={1.5} />
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
            <Camera size={16} strokeWidth={1.5} />
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
    </>
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
