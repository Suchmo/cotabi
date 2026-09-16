import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Spot } from '../types/models'

const tripsCollection = collection(db, 'trips')
const spotsCollection = collection(db, 'spots')

export type CreateRecordInput = {
  tripTitle: string
  countryCode: string
  prefectureCode: string | null
  spotName: string
  visitedAt: string
  diaryText: string
  userId: string
  userEmail: string | null
}

export async function createTripAndSpot(input: CreateRecordInput) {
  const tripRef = await addDoc(tripsCollection, {
    title: input.tripTitle,
    countryCode: input.countryCode,
    prefectureCode: input.prefectureCode,
    startDate: input.visitedAt,
    endDate: input.visitedAt,
    createdBy: input.userId,
    createdByEmail: input.userEmail,
    createdAt: serverTimestamp(),
  })

  const spotRef = await addDoc(spotsCollection, {
    tripId: tripRef.id,
    name: input.spotName,
    diaryText: input.diaryText,
    visitedAt: input.visitedAt,
    countryCode: input.countryCode,
    prefectureCode: input.prefectureCode,
    // 写真アップロード同様、位置情報の取得は次のステップで対応する
    latitude: null,
    longitude: null,
    recordedBy: input.userId,
    recordedByEmail: input.userEmail,
    createdAt: serverTimestamp(),
  })

  return { tripId: tripRef.id, spotId: spotRef.id }
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
    const data = doc.data()
    const tripId = (data.tripId as string | null) ?? null
    return {
      id: doc.id,
      tripId,
      name: data.name,
      diaryText: data.diaryText,
      visitedAt: data.visitedAt,
      countryCode: data.countryCode,
      prefectureCode: data.prefectureCode ?? null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      recordedBy: data.recordedBy,
      recordedByEmail: data.recordedByEmail ?? null,
      createdAt: data.createdAt ?? null,
      tripTitle: tripId ? (tripTitleById.get(tripId) ?? null) : null,
    }
  })
}
