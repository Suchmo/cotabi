import type { QueryDocumentSnapshot } from 'firebase/firestore'
import type { Photo, Spot, Trip, Wish } from '../types/models'

export function tripFromDoc(doc: QueryDocumentSnapshot): Trip {
  const data = doc.data()
  return {
    id: doc.id,
    title: data.title,
    countryCode: data.countryCode,
    prefectureCode: data.prefectureCode ?? null,
    startDate: data.startDate,
    endDate: data.endDate,
    costYen: (data.costYen as number | undefined) ?? null,
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

export function photoFromDoc(doc: QueryDocumentSnapshot): Photo {
  const data = doc.data()
  return {
    id: doc.id,
    spotId: data.spotId,
    storagePath: data.storagePath,
    downloadUrl: data.downloadUrl,
    // サムネイル生成前にアップロードされた旧データにはこれらのフィールドが
    // 無いため、フルサイズ画像へフォールバックする。
    thumbnailStoragePath: data.thumbnailStoragePath ?? data.storagePath,
    thumbnailUrl: data.thumbnailUrl ?? data.downloadUrl,
    uploadedAt: data.uploadedAt ?? null,
  }
}

export function wishFromDoc(doc: QueryDocumentSnapshot): Wish {
  const data = doc.data()
  return {
    id: doc.id,
    placeName: data.placeName,
    countryCode: data.countryCode ?? null,
    prefectureCode: data.prefectureCode ?? null,
    latitude: data.latitude,
    longitude: data.longitude,
    memo: data.memo ?? '',
    createdBy: data.createdBy,
    createdByEmail: data.createdByEmail ?? null,
    createdAt: data.createdAt ?? null,
  }
}
