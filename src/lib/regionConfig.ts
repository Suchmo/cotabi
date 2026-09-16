import { prefectureCodeForName } from './japanPrefectures'

export type RegionKind = 'world' | 'japan'

export const REGION_LABEL: Record<RegionKind, string> = {
  world: '世界',
  japan: '日本',
}

export const REGION_GEOJSON_URL: Record<RegionKind, string> = {
  world: '/geo/world-countries.geojson',
  japan: '/geo/japan-prefectures.geojson',
}

export const REGION_CENTER: Record<RegionKind, [number, number]> = {
  world: [20, 0],
  japan: [36.5, 137.5],
}

export const REGION_ZOOM: Record<RegionKind, number> = {
  world: 2,
  japan: 5,
}

// world地図は国(properties.ISO_A2_EH)、japan地図は都道府県
// (properties.N03_001の名称からコードを引く)でfeatureを識別する。
// マップ画面・地域詳細画面の両方で同じ判定を使うための共通ロジック。
export function getFeatureId(
  kind: RegionKind,
  feature: GeoJSON.Feature,
): string | undefined {
  if (kind === 'world') {
    return feature.properties?.ISO_A2_EH as string | undefined
  }
  return prefectureCodeForName(
    feature.properties?.N03_001 as string | undefined,
  )
}
