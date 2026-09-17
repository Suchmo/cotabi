import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'
import { spotFromDoc, tripFromDoc } from './firestoreMappers'
import { listPhotosBySpotId } from './photos'
import type { Photo, Spot, Trip } from '../types/models'

const tripsCollection = collection(db, 'trips')
const spotsCollection = collection(db, 'spots')

export type SpotInput = {
  countryCode: string
  prefectureCode: string | null
  spotName: string
  visitedAt: string
  diaryText: string
  latitude: number | null
  longitude: number | null
}

export type CreateTripInput = {
  tripTitle: string
  // 空ならスポットの日付から自動算出する
  startDate: string | null
  endDate: string | null
  spots: SpotInput[]
  userId: string
  userEmail: string | null
}

// 「新しい旅行を作る」フロー。1つの旅行に複数スポットをまとめて登録できる
// (例: 「ヨーロッパ旅行」にイタリア・スイス・フランスのスポットを一度に追加)。
// 旅行ドキュメントとスポットドキュメント群を1つのバッチとして書き込み、
// 途中で失敗して旅行だけ・一部スポットだけが残ることがないようにする。
export async function createTripWithSpots(input: CreateTripInput): Promise<{
  tripId: string
  spotIds: string[]
}> {
  const batch = writeBatch(db)

  const tripRef = doc(tripsCollection)
  const visitedDates = input.spots.map((s) => s.visitedAt).sort()
  const firstSpot = input.spots[0]

  batch.set(tripRef, {
    title: input.tripTitle,
    countryCode: firstSpot.countryCode,
    prefectureCode: firstSpot.prefectureCode,
    startDate: input.startDate || visitedDates[0],
    endDate: input.endDate || visitedDates[visitedDates.length - 1],
    createdBy: input.userId,
    createdByEmail: input.userEmail,
    createdAt: serverTimestamp(),
  })

  const spotIds: string[] = []
  for (const spot of input.spots) {
    const spotRef = doc(spotsCollection)
    batch.set(spotRef, {
      tripId: tripRef.id,
      name: spot.spotName,
      diaryText: spot.diaryText,
      visitedAt: spot.visitedAt,
      countryCode: spot.countryCode,
      prefectureCode: spot.prefectureCode,
      latitude: spot.latitude,
      longitude: spot.longitude,
      recordedBy: input.userId,
      recordedByEmail: input.userEmail,
      createdAt: serverTimestamp(),
    })
    spotIds.push(spotRef.id)
  }

  await batch.commit()

  return { tripId: tripRef.id, spotIds }
}

export async function listTrips(): Promise<Trip[]> {
  const snapshot = await getDocs(tripsCollection)
  return snapshot.docs
    .map(tripFromDoc)
    .sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0))
}

export type AddSpotInput = {
  tripId: string
  countryCode: string
  prefectureCode: string | null
  spotName: string
  visitedAt: string
  diaryText: string
  latitude: number | null
  longitude: number | null
  userId: string
  userEmail: string | null
}

// 既存の旅行に、その旅行とは別の国・都道府県のスポットを追加できるようにする
// (例: 「ヨーロッパ旅行」1件の中にイタリア・スイス・フランスのスポットを混在させる)。
// TRIPドキュメントのcountryCode/prefectureCodeは最初のスポット作成時点のまま
// 更新しない(訪問済み判定・地図のルート表示はいずれもSPOT側のcountryCode/
// prefectureCodeだけを見る設計のため、複数国が混在しても影響しない)。
export async function addSpotToTrip(input: AddSpotInput) {
  const spotRef = await addDoc(spotsCollection, {
    tripId: input.tripId,
    name: input.spotName,
    diaryText: input.diaryText,
    visitedAt: input.visitedAt,
    countryCode: input.countryCode,
    prefectureCode: input.prefectureCode,
    latitude: input.latitude,
    longitude: input.longitude,
    recordedBy: input.userId,
    recordedByEmail: input.userEmail,
    createdAt: serverTimestamp(),
  })

  return { spotId: spotRef.id }
}

export type SpotWithTripTitle = Spot & { tripTitle: string | null }

export async function listSpotsWithTrips(): Promise<SpotWithTripTitle[]> {
  const [tripsSnap, spotsSnap] = await Promise.all([
    getDocs(tripsCollection),
    getDocs(query(spotsCollection, orderBy('createdAt', 'desc'))),
  ])

  const tripTitleById = new Map<string, string>()
  tripsSnap.forEach((doc) => {
    tripTitleById.set(doc.id, doc.data().title as string)
  })

  return spotsSnap.docs.map((doc) => {
    const spot = spotFromDoc(doc)
    return {
      ...spot,
      tripTitle: spot.tripId ? (tripTitleById.get(spot.tripId) ?? null) : null,
    }
  })
}

export type SpotWithPhotos = Spot & {
  photos: Photo[]
  thumbnailUrl: string | null
}

export async function getTripWithSpots(tripId: string): Promise<{
  title: string
  countryCode: string
  prefectureCode: string | null
  spots: SpotWithPhotos[]
} | null> {
  const [tripsSnap, spotsSnap, photosBySpotId] = await Promise.all([
    getDocs(tripsCollection),
    getDocs(spotsCollection),
    listPhotosBySpotId(),
  ])

  const tripDoc = tripsSnap.docs.find((doc) => doc.id === tripId)
  if (!tripDoc) return null
  const tripData = tripDoc.data()

  const spots = spotsSnap.docs
    .map(spotFromDoc)
    .filter((spot) => spot.tripId === tripId)
    .sort((a, b) => a.visitedAt.localeCompare(b.visitedAt))
    .map((spot) => {
      const photos = photosBySpotId.get(spot.id) ?? []
      return {
        ...spot,
        photos,
        thumbnailUrl: photos[0]?.downloadUrl ?? null,
      }
    })

  return {
    title: tripData.title as string,
    countryCode: tripData.countryCode as string,
    prefectureCode: (tripData.prefectureCode ?? null) as string | null,
    spots,
  }
}

export type FlashbackSpot = {
  spot: Spot
  yearsAgo: number
  tripTitle: string | null
  thumbnailUrl: string | null
}

// 思い出フラッシュバック(Phase2)。今日と同じ月日(年は問わない)に記録された
// 過去のスポットを、経過年数(yearsAgo、1以上)とともに返す。同じ月日でも
// 今年記録されたばかりのもの(yearsAgo === 0)は「思い出」ではないため除外する。
export async function listFlashbackSpots(): Promise<FlashbackSpot[]> {
  const [tripsSnap, spotsSnap, photosBySpotId] = await Promise.all([
    getDocs(tripsCollection),
    getDocs(spotsCollection),
    listPhotosBySpotId(),
  ])

  const tripTitleById = new Map<string, string>()
  tripsSnap.forEach((doc) => {
    tripTitleById.set(doc.id, doc.data().title as string)
  })

  const today = new Date()
  const todayMonth = today.getMonth() + 1
  const todayDate = today.getDate()
  const todayYear = today.getFullYear()

  const results: FlashbackSpot[] = []
  spotsSnap.docs.forEach((doc) => {
    const spot = spotFromDoc(doc)
    const [yearStr, monthStr, dayStr] = spot.visitedAt.split('-')
    if (Number(monthStr) !== todayMonth || Number(dayStr) !== todayDate) return

    const yearsAgo = todayYear - Number(yearStr)
    if (yearsAgo <= 0) return

    const photos = photosBySpotId.get(spot.id) ?? []
    results.push({
      spot,
      yearsAgo,
      tripTitle: spot.tripId ? (tripTitleById.get(spot.tripId) ?? null) : null,
      thumbnailUrl: photos[0]?.downloadUrl ?? null,
    })
  })

  return results.sort((a, b) => a.yearsAgo - b.yearsAgo)
}

export type SpotDetail = {
  spot: Spot
  tripTitle: string | null
  photos: Photo[]
}

export async function getSpotDetail(spotId: string): Promise<SpotDetail | null> {
  const [spotsSnap, tripsSnap, photosBySpotId] = await Promise.all([
    getDocs(spotsCollection),
    getDocs(tripsCollection),
    listPhotosBySpotId(),
  ])

  const spotDoc = spotsSnap.docs.find((doc) => doc.id === spotId)
  if (!spotDoc) return null

  const spot = spotFromDoc(spotDoc)
  const tripTitle = spot.tripId
    ? ((tripsSnap.docs.find((doc) => doc.id === spot.tripId)?.data()
        .title as string | undefined) ?? null)
    : null

  return {
    spot,
    tripTitle,
    photos: photosBySpotId.get(spot.id) ?? [],
  }
}
