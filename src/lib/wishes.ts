import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { wishFromDoc } from './firestoreMappers'
import type { Wish } from '../types/models'

const wishesCollection = collection(db, 'wishes')

export type WishInput = {
  placeName: string
  countryCode: string | null
  prefectureCode: string | null
  latitude: number
  longitude: number
  memo: string
  userId: string
  userEmail: string | null
}

export async function createWish(input: WishInput): Promise<string> {
  const ref = await addDoc(wishesCollection, {
    placeName: input.placeName,
    countryCode: input.countryCode,
    prefectureCode: input.prefectureCode,
    latitude: input.latitude,
    longitude: input.longitude,
    memo: input.memo,
    createdBy: input.userId,
    createdByEmail: input.userEmail,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function listWishes(): Promise<Wish[]> {
  const snapshot = await getDocs(query(wishesCollection, orderBy('createdAt', 'desc')))
  return snapshot.docs.map(wishFromDoc)
}

export async function deleteWish(id: string): Promise<void> {
  await deleteDoc(doc(db, 'wishes', id))
}
