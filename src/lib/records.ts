import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { spotFromDoc } from './firestoreMappers'
import { listPhotosBySpotId } from './photos'
import type { Photo, Spot } from '../types/models'

const tripsCollection = collection(db, 'trips')
const spotsCollection = collection(db, 'spots')

export type CreateRecordInput = {
  tripTitle: string
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
    latitude: input.latitude,
    longitude: input.longitude,
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
    const spot = spotFromDoc(doc)
    return {
      ...spot,
      tripTitle: spot.tripId ? (tripTitleById.get(spot.tripId) ?? null) : null,
    }
  })
}

export type SpotWithThumbnail = Spot & { thumbnailUrl: string | null }

export async function getTripWithSpots(tripId: string): Promise<{
  title: string
  countryCode: string
  prefectureCode: string | null
  spots: SpotWithThumbnail[]
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
    .map((spot) => ({
      ...spot,
      thumbnailUrl: photosBySpotId.get(spot.id)?.[0]?.downloadUrl ?? null,
    }))

  return {
    title: tripData.title as string,
    countryCode: tripData.countryCode as string,
    prefectureCode: (tripData.prefectureCode ?? null) as string | null,
    spots,
  }
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
