import type { Timestamp } from 'firebase/firestore'

// docs/screen_design_v4.md のER図(TRIP)に対応。
// snake_case のフィールド名(trip_id 等)はJS/TSの慣習に合わせてcamelCaseで保持する。
export type Trip = {
  id: string
  title: string
  countryCode: string
  prefectureCode: string | null
  startDate: string
  endDate: string
  createdBy: string
  createdByEmail: string | null
  createdAt: Timestamp | null
}

// docs/screen_design_v4.md のER図(SPOT)に対応。
// CLAUDE.mdの「訪問済み判定・統計集計ルール」に従い、tripIdの有無にかかわらず
// countryCode/prefectureCodeを必ず保持する(TRIP経由でのみ国を判定しない)。
export type Spot = {
  id: string
  tripId: string | null
  name: string
  diaryText: string
  visitedAt: string
  countryCode: string
  prefectureCode: string | null
  latitude: number | null
  longitude: number | null
  recordedBy: string
  recordedByEmail: string | null
  createdAt: Timestamp | null
}

// docs/screen_design_v4.md のER図(PHOTO)に対応。
// downloadUrl はER図にはないが、Storageから毎回getDownloadURLし直さずに
// 一覧表示できるよう、アップロード時に取得したURLを保持する。
export type Photo = {
  id: string
  spotId: string
  storagePath: string
  downloadUrl: string
  uploadedAt: Timestamp | null
}
