import { COUNTRIES } from './countries'
import { prefectureCodeForName } from './japanPrefectures'

export type PlaceResult = {
  displayName: string
  lat: number
  lon: number
  // 自国コード一覧(COUNTRIES)に存在するもののみを返す。不明な場合はnull
  countryCode: string | null
  // 都道府県名から一致するJISコードが引けた場合のみ返す(日本以外や
  // 名称が一致しない場合はnull)。いずれもユーザーが確認・修正できる前提の
  // 補助的な自動入力であり、正としては扱わない。
  prefectureCode: string | null
}

const knownCountryCodes = new Set(COUNTRIES.map((c) => c.code))

// Nominatimの利用規約により、1秒間に1回を超えるリクエストを送らない。
// デバウンス(呼び出し側)に加えて、ここでも最終リクエスト時刻を見て
// 必要なら待ってから送る安全策を入れておく。
const MIN_REQUEST_INTERVAL_MS = 1000
let lastRequestAt = 0

type NominatimAddress = {
  country_code?: string
  state?: string
}

type NominatimApiResult = {
  display_name: string
  lat: string
  lon: string
  address?: NominatimAddress
}

// NominatimはブラウザからのUser-Agent指定を許可していない(fetchで
// 上書きできない予約ヘッダーのため)。利用規約が代替として認めている
// HTTP Refererは、クロスオリジンリクエスト時にブラウザが自動的に
// 付与するものをそのまま利用する(このアプリのURLがReferer相当になる)。
export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<PlaceResult[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const waitMs = MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt)
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs))
  }
  if (signal?.aborted) return []
  lastRequestAt = Date.now()

  const params = new URLSearchParams({
    q: trimmed,
    format: 'json',
    addressdetails: '1',
    limit: '5',
    'accept-language': 'ja',
  })

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    { signal },
  )
  if (!response.ok) {
    throw new Error(`Nominatim request failed: ${response.status}`)
  }

  const data = (await response.json()) as NominatimApiResult[]

  return data.map((item) => {
    const countryCode = item.address?.country_code?.toUpperCase() ?? null
    return {
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      countryCode: countryCode && knownCountryCodes.has(countryCode) ? countryCode : null,
      prefectureCode: prefectureCodeForName(item.address?.state) ?? null,
    }
  })
}
