import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from './firebase'
import { compressImage } from './imageCompression'
import type { Photo } from '../types/models'

const photosCollection = collection(db, 'photos')

function randomId() {
  return crypto.randomUUID()
}

export async function uploadPhotosForSpot(
  spotId: string,
  files: File[],
): Promise<void> {
  await Promise.all(
    files.map(async (file) => {
      const compressed = await compressImage(file)
      const storagePath = `spots/${spotId}/${randomId()}.jpg`
      const storageRef = ref(storage, storagePath)

      await uploadBytes(storageRef, compressed, {
        contentType: 'image/jpeg',
      })
      const downloadUrl = await getDownloadURL(storageRef)

      await addDoc(photosCollection, {
        spotId,
        storagePath,
        downloadUrl,
        uploadedAt: serverTimestamp(),
      })
    }),
  )
}

export async function getPhotosForSpot(spotId: string): Promise<Photo[]> {
  const snapshot = await getDocs(
    query(photosCollection, where('spotId', '==', spotId)),
  )
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      spotId: data.spotId,
      storagePath: data.storagePath,
      downloadUrl: data.downloadUrl,
      uploadedAt: data.uploadedAt ?? null,
    }
  })
}

// Storage上の画像ファイルの削除のみを行う(Firestoreの写真ドキュメント自体は、
// 呼び出し側でスポット/旅行の削除とまとめて1つのwriteBatchに含めることで、
// 「一部だけ削除された」状態を避ける)。既に無い/失敗したファイルがあっても
// 全体の削除操作は続行できるよう、ここではエラーを握りつぶす。
export async function deletePhotoFiles(photos: Photo[]): Promise<void> {
  await Promise.all(
    photos.map((photo) =>
      deleteObject(ref(storage, photo.storagePath)).catch(() => {}),
    ),
  )
}

export async function listPhotosBySpotId(): Promise<Map<string, Photo[]>> {
  const snapshot = await getDocs(photosCollection)
  const bySpotId = new Map<string, Photo[]>()

  snapshot.forEach((doc) => {
    const data = doc.data()
    const photo: Photo = {
      id: doc.id,
      spotId: data.spotId,
      storagePath: data.storagePath,
      downloadUrl: data.downloadUrl,
      uploadedAt: data.uploadedAt ?? null,
    }
    const existing = bySpotId.get(photo.spotId)
    if (existing) {
      existing.push(photo)
    } else {
      bySpotId.set(photo.spotId, [photo])
    }
  })

  return bySpotId
}
