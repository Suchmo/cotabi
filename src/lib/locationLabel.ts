import { COUNTRIES } from './countries'
import { JAPAN_PREFECTURES } from './japanPrefectures'

const countryNameByCode = new Map(COUNTRIES.map((c) => [c.code, c.name]))
const prefectureNameByCode = new Map(
  JAPAN_PREFECTURES.map((p) => [p.code, p.name]),
)

export function formatLocationLabel(
  countryCode: string,
  prefectureCode: string | null,
): string {
  const country = countryNameByCode.get(countryCode) ?? countryCode
  const prefecture = prefectureCode
    ? (prefectureNameByCode.get(prefectureCode) ?? prefectureCode)
    : null
  return prefecture ? `${country} / ${prefecture}` : country
}

// 1つの旅行に複数の国・都道府県のスポットが混在する場合(例:
// 「ヨーロッパ旅行」にイタリア・スイス・フランスが混在)、重複を除いて
// 登場順に並べたラベルを作る(例:「イタリア、スイス、フランス」)。
export function formatDistinctLocationsLabel(
  locations: { countryCode: string; prefectureCode: string | null }[],
): string {
  const seen = new Set<string>()
  const labels: string[] = []
  for (const { countryCode, prefectureCode } of locations) {
    const key = `${countryCode}:${prefectureCode ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    labels.push(formatLocationLabel(countryCode, prefectureCode))
  }
  return labels.length > 0 ? labels.join('、') : '記録なし'
}
