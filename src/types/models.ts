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
  // 簡易費用記録(Phase3)。旅行全体でのおおまかな合計金額(円)のみを扱い、
  // 内訳管理はしない。未入力ならnull。
  costYen: number | null
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
  // タグ・カテゴリ付け(Phase2)。プリセット(src/lib/tags.ts)または
  // 自由入力の文字列をそのまま保持する。検索・絞り込み(Phase3)は対象外。
  tags: string[]
  recordedBy: string
  recordedByEmail: string | null
  createdAt: Timestamp | null
}

// docs/requirements_v5.md のPhase3「ウィッシュリスト」に対応。
// TRIP/SPOTとは別のコレクション(wishes)で管理し、訪問済みとは明確に区別する。
// 「訪問済みに変換」機能は持たず、実際に記録(SPOT)を作成した後は
// このドキュメントを削除するだけのシンプルな運用とする。
export type Wish = {
  id: string
  placeName: string
  countryCode: string | null
  prefectureCode: string | null
  latitude: number
  longitude: number
  memo: string
  createdBy: string
  createdByEmail: string | null
  createdAt: Timestamp | null
}

// docs/screen_design_v4.md のER図(PHOTO)に対応。
// downloadUrl はER図にはないが、Storageから毎回getDownloadURLし直さずに
// 一覧表示できるよう、アップロード時に取得したURLを保持する。
// thumbnailStoragePath/thumbnailUrlは一覧・サムネイル表示専用の縮小版
// (長辺300px程度)。サムネイル生成前にアップロードされた旧データには
// 存在しないため、読み込み側(firestoreMappers.photoFromDoc)でフルサイズ
// 画像へフォールバックする。
export type Photo = {
  id: string
  spotId: string
  storagePath: string
  downloadUrl: string
  thumbnailStoragePath: string
  thumbnailUrl: string
  uploadedAt: Timestamp | null
}
