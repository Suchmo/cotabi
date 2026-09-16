import { useEffect, useState, type ChangeEvent } from 'react'
import { X, ImagePlus, Camera, MapPin, Search } from 'lucide-react'
import { Combobox, type ComboboxOption } from './Combobox'
import { searchPlaces, type PlaceResult } from '../lib/nominatim'
import { COUNTRIES } from '../lib/countries'
import { JAPAN_COUNTRY_CODE, JAPAN_PREFECTURES } from '../lib/japanPrefectures'

const COUNTRY_OPTIONS: ComboboxOption[] = COUNTRIES.map((c) => ({
  value: c.code,
  label: c.name,
}))

const PREFECTURE_OPTIONS: ComboboxOption[] = [
  { value: '', label: '(未選択)' },
  ...JAPAN_PREFECTURES.map((p) => ({ value: p.code, label: p.name })),
]

const PLACE_SEARCH_DEBOUNCE_MS = 600

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

  const [placeQuery, setPlaceQuery] = useState('')
  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([])
  const [placeSearching, setPlaceSearching] = useState(false)
  const [placeError, setPlaceError] = useState<string | null>(null)

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

  // Nominatimの利用規約に沿って、入力が止まってから1回だけ検索する
  // (デバウンス)。検索中に新しい入力が来たら、前のリクエストは中断する。
  useEffect(() => {
    if (placeQuery.trim().length < 2) {
      setPlaceResults([])
      setPlaceError(null)
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
  }, [placeQuery])

  const handleSelectPlace = (place: PlaceResult) => {
    onChange({
      location: { lat: place.lat, lng: place.lon },
      ...(place.countryCode ? { countryCode: place.countryCode } : {}),
      ...(place.countryCode && place.countryCode !== JAPAN_COUNTRY_CODE
        ? { prefectureCode: '' }
        : {}),
      ...(place.prefectureCode ? { prefectureCode: place.prefectureCode } : {}),
    })
    setPlaceQuery(place.displayName)
    setPlaceResults([])
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
        <Combobox
          value={value.countryCode}
          onChange={(code) => onChange({ countryCode: code, prefectureCode: '' })}
          options={COUNTRY_OPTIONS}
          placeholder="国名で検索"
          required
        />
      </label>
      {isJapan && (
        <label>
          都道府県
          <Combobox
            value={value.prefectureCode}
            onChange={(code) => onChange({ prefectureCode: code })}
            options={PREFECTURE_OPTIONS}
            placeholder="都道府県名で検索"
          />
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

        <div className="record-form__place-search">
          <div className="record-form__place-search-input">
            <Search size={14} strokeWidth={1.5} />
            <input
              type="text"
              placeholder="場所を検索(例: 東京タワー)"
              value={placeQuery}
              onChange={(e) => setPlaceQuery(e.target.value)}
            />
          </div>
          {placeSearching && (
            <p className="record-form__location-status">検索中…</p>
          )}
          {placeError && <p className="record-form__error">{placeError}</p>}
          {placeResults.length > 0 && (
            <ul className="record-form__place-results">
              {placeResults.map((place) => (
                <li key={`${place.lat},${place.lon}`}>
                  <button
                    type="button"
                    onClick={() => handleSelectPlace(place)}
                  >
                    {place.displayName}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="record-form__attribution">
            位置情報検索: OpenStreetMap Nominatim
          </p>
        </div>
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
