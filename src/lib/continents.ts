// public/geo/world-countries.geojson の properties.CONTINENT の値
// (Natural Earthのデータに基づく)。Antarctica・Seven seas (open ocean) は
// 旅行先として想定しづらいため、絞り込みタブには含めない
// (「すべて」を選べば引き続き表示される)。
export type Continent =
  | 'Africa'
  | 'Asia'
  | 'Europe'
  | 'North America'
  | 'Oceania'
  | 'South America'

export type ContinentOption = {
  value: Continent
  label: string
  center: [number, number]
  zoom: number
}

export const CONTINENTS: ContinentOption[] = [
  { value: 'Asia', label: 'アジア', center: [34, 90], zoom: 3 },
  { value: 'Europe', label: 'ヨーロッパ', center: [54, 15], zoom: 3 },
  { value: 'Africa', label: 'アフリカ', center: [3, 20], zoom: 3 },
  { value: 'North America', label: '北米', center: [48, -100], zoom: 3 },
  { value: 'South America', label: '南米', center: [-15, -60], zoom: 3 },
  { value: 'Oceania', label: 'オセアニア', center: [-22, 145], zoom: 3 },
]

export const ALL_CONTINENTS_VALUE = 'all'
