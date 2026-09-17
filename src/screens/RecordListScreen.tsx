import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp, Plus, SlidersHorizontal } from 'lucide-react'
import { listSpotsWithTrips, type SpotWithTripTitle } from '../lib/records'
import { listPhotosBySpotId } from '../lib/photos'
import { formatLocationLabel } from '../lib/locationLabel'
import { Combobox, type ComboboxOption } from '../components/Combobox'
import { COUNTRIES } from '../lib/countries'
import { JAPAN_COUNTRY_CODE, JAPAN_PREFECTURES } from '../lib/japanPrefectures'
import { PRESET_TAGS } from '../lib/tags'
import type { Photo } from '../types/models'
import './RecordListScreen.css'

const COUNTRY_FILTER_OPTIONS: ComboboxOption[] = [
  { value: '', label: 'すべての国' },
  ...COUNTRIES.map((c) => ({ value: c.code, label: c.name })),
]

const PREFECTURE_FILTER_OPTIONS: ComboboxOption[] = [
  { value: '', label: 'すべての都道府県' },
  ...JAPAN_PREFECTURES.map((p) => ({ value: p.code, label: p.name })),
]

type Filters = {
  startDate: string
  endDate: string
  countryCode: string
  prefectureCode: string
  tags: string[]
}

const EMPTY_FILTERS: Filters = {
  startDate: '',
  endDate: '',
  countryCode: '',
  prefectureCode: '',
  tags: [],
}

function matchesFilters(spot: SpotWithTripTitle, filters: Filters): boolean {
  if (filters.startDate && spot.visitedAt < filters.startDate) return false
  if (filters.endDate && spot.visitedAt > filters.endDate) return false
  if (filters.countryCode && spot.countryCode !== filters.countryCode) return false
  if (
    filters.countryCode === JAPAN_COUNTRY_CODE &&
    filters.prefectureCode &&
    spot.prefectureCode !== filters.prefectureCode
  ) {
    return false
  }
  if (filters.tags.length > 0 && !spot.tags.some((tag) => filters.tags.includes(tag))) {
    return false
  }
  return true
}

function locationLabel(spot: SpotWithTripTitle) {
  return formatLocationLabel(spot.countryCode, spot.prefectureCode)
}

function dateRangeLabel(spots: SpotWithTripTitle[]): string {
  const dates = spots.map((s) => s.visitedAt).sort()
  const first = dates[0]
  const last = dates[dates.length - 1]
  return first === last ? first : `${first} 〜 ${last}`
}

type TripGroup = {
  tripId: string
  tripTitle: string
  startDate: string
  dateRangeLabel: string
  spots: SpotWithTripTitle[]
}

function groupSpots(spots: SpotWithTripTitle[]): {
  tripGroups: TripGroup[]
  standalone: SpotWithTripTitle[]
} {
  const byTripId = new Map<string, SpotWithTripTitle[]>()
  const standalone: SpotWithTripTitle[] = []

  for (const spot of spots) {
    if (!spot.tripId) {
      standalone.push(spot)
      continue
    }
    const list = byTripId.get(spot.tripId)
    if (list) list.push(spot)
    else byTripId.set(spot.tripId, [spot])
  }

  const tripGroups = Array.from(byTripId.entries())
    .map(([tripId, groupSpots]) => {
      const sorted = groupSpots
        .slice()
        .sort((a, b) => a.visitedAt.localeCompare(b.visitedAt))
      return {
        tripId,
        tripTitle: groupSpots[0].tripTitle ?? '(旅行)',
        startDate: sorted[0].visitedAt,
        dateRangeLabel: dateRangeLabel(sorted),
        spots: sorted,
      }
    })
    .sort((a, b) => b.startDate.localeCompare(a.startDate))

  standalone.sort((a, b) => b.visitedAt.localeCompare(a.visitedAt))

  return { tripGroups, standalone }
}

export function RecordListScreen() {
  const [spots, setSpots] = useState<SpotWithTripTitle[] | null>(null)
  const [photosBySpotId, setPhotosBySpotId] = useState<Map<string, Photo[]>>(
    new Map(),
  )
  const [error, setError] = useState<string | null>(null)

  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)

  useEffect(() => {
    Promise.all([listSpotsWithTrips(), listPhotosBySpotId()])
      .then(([spots, photos]) => {
        setSpots(spots)
        setPhotosBySpotId(photos)
      })
      .catch(() => setError('記録の取得に失敗しました。'))
  }, [])

  const availableTags = useMemo(() => {
    const tags = new Set(PRESET_TAGS)
    spots?.forEach((spot) => spot.tags.forEach((tag) => tags.add(tag)))
    return Array.from(tags)
  }, [spots])

  const hasActiveFilters =
    !!filters.startDate ||
    !!filters.endDate ||
    !!filters.countryCode ||
    !!filters.prefectureCode ||
    filters.tags.length > 0

  const filteredSpots = useMemo(
    () => (spots ?? []).filter((spot) => matchesFilters(spot, filters)),
    [spots, filters],
  )

  const { tripGroups, standalone } = useMemo(
    () => groupSpots(filteredSpots),
    [filteredSpots],
  )

  const toggleTag = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }))
  }

  const clearFilters = () => setFilters(EMPTY_FILTERS)

  return (
    <div className="record-list">
      <h1>記録一覧</h1>
      <p>
        <Link to="/records/new" className="record-list__new-link">
          <Plus size={16} strokeWidth={1.5} />
          新しい記録を作成
        </Link>
      </p>

      <div className="record-list__filter">
        <button
          type="button"
          className="record-list__filter-toggle"
          onClick={() => setFiltersOpen((prev) => !prev)}
        >
          <SlidersHorizontal size={16} strokeWidth={1.5} />
          絞り込み
          {hasActiveFilters && <span className="record-list__filter-badge" />}
          {filtersOpen ? (
            <ChevronUp size={16} strokeWidth={1.5} />
          ) : (
            <ChevronDown size={16} strokeWidth={1.5} />
          )}
        </button>

        {filtersOpen && (
          <div className="record-list__filter-panel">
            <div className="record-list__filter-date-range">
              <label>
                開始日
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                />
              </label>
              <label>
                終了日
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                />
              </label>
            </div>

            <label>
              国
              <Combobox
                value={filters.countryCode}
                onChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    countryCode: value,
                    prefectureCode: '',
                  }))
                }
                options={COUNTRY_FILTER_OPTIONS}
                placeholder="国名で検索"
              />
            </label>
            {filters.countryCode === JAPAN_COUNTRY_CODE && (
              <label>
                都道府県
                <Combobox
                  value={filters.prefectureCode}
                  onChange={(value) =>
                    setFilters((prev) => ({ ...prev, prefectureCode: value }))
                  }
                  options={PREFECTURE_FILTER_OPTIONS}
                  placeholder="都道府県名で検索"
                />
              </label>
            )}

            <div className="record-list__filter-tags">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={filters.tags.includes(tag) ? 'is-selected' : ''}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="record-list__filter-clear"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
            >
              絞り込みをクリア
            </button>
          </div>
        )}
      </div>

      {error && <p>{error}</p>}
      {!error && spots === null && <p>読み込み中…</p>}
      {spots !== null && spots.length === 0 && <p>まだ記録がありません。</p>}
      {spots !== null &&
        spots.length > 0 &&
        filteredSpots.length === 0 && <p>絞り込み条件に一致する記録がありません。</p>}

      {tripGroups.map((group) => (
        <div key={group.tripId} className="record-list__group">
          <Link
            to={`/trips/${group.tripId}`}
            className="record-list__group-heading"
          >
            {group.tripTitle}({group.dateRangeLabel})
          </Link>
          {group.spots.map((spot) => (
            <SpotCard
              key={spot.id}
              spot={spot}
              photos={photosBySpotId.get(spot.id) ?? []}
            />
          ))}
        </div>
      ))}

      {standalone.length > 0 && (
        <div className="record-list__group">
          <h2 className="record-list__group-heading record-list__group-heading--plain">
            単発の記録
          </h2>
          {standalone.map((spot) => (
            <SpotCard
              key={spot.id}
              spot={spot}
              photos={photosBySpotId.get(spot.id) ?? []}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SpotCard({
  spot,
  photos,
}: {
  spot: SpotWithTripTitle
  photos: Photo[]
}) {
  return (
    <Link to={`/spots/${spot.id}`} className="record-list__item">
      <h3>{spot.name}</h3>
      <p className="record-list__meta">
        {locationLabel(spot)} ・ {spot.visitedAt} ・{' '}
        {spot.recordedByEmail ?? spot.recordedBy}
      </p>
      {spot.tags.length > 0 && (
        <div className="record-list__tags">
          {spot.tags.map((tag) => (
            <span key={tag} className="record-list__tag">
              {tag}
            </span>
          ))}
        </div>
      )}
      {photos.length > 0 && (
        <div className="record-list__photo-grid">
          {photos.map((photo) => (
            <img
              key={photo.id}
              src={photo.downloadUrl}
              alt=""
              className="record-list__photo-thumb"
            />
          ))}
        </div>
      )}
      <p className="record-list__diary">{spot.diaryText}</p>
    </Link>
  )
}
