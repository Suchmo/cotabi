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
