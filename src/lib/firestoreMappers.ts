import type { QueryDocumentSnapshot } from 'firebase/firestore'
import type { Spot, Trip } from '../types/models'

export function tripFromDoc(doc: QueryDocumentSnapshot): Trip {
  const data = doc.data()
  return {
    id: doc.id,
    title: data.title,
    countryCode: data.countryCode,
    prefectureCode: data.prefectureCode ?? null,
    startDate: data.startDate,
    endDate: data.endDate,
    createdBy: data.createdBy,
    createdByEmail: data.createdByEmail ?? null,
    createdAt: data.createdAt ?? null,
  }
}

export function spotFromDoc(doc: QueryDocumentSnapshot): Spot {
  const data = doc.data()
  return {
    id: doc.id,
    tripId: (data.tripId as string | null) ?? null,
    name: data.name,
    diaryText: data.diaryText,
    visitedAt: data.visitedAt,
    countryCode: data.countryCode,
    prefectureCode: data.prefectureCode ?? null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    tags: (data.tags as string[] | undefined) ?? [],
    recordedBy: data.recordedBy,
    recordedByEmail: data.recordedByEmail ?? null,
    createdAt: data.createdAt ?? null,
  }
}
