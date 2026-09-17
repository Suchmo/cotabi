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
import { photoFromDoc } from './firestoreMappers'
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
      const { full, thumbnail } = await compressImage(file)
      const id = randomId()
      const storagePath = `spots/${spotId}/${id}.jpg`
      const thumbnailStoragePath = `spots/${spotId}/${id}_thumb.jpg`

      const storageRef = ref(storage, storagePath)
      const thumbnailRef = ref(storage, thumbnailStoragePath)

      const [downloadUrl, thumbnailUrl] = await Promise.all([
        uploadBytes(storageRef, full, { contentType: 'image/jpeg' }).then(() =>
          getDownloadURL(storageRef),
        ),
        uploadBytes(thumbnailRef, thumbnail, { contentType: 'image/jpeg' }).then(
          () => getDownloadURL(thumbnailRef),
        ),
      ])

      await addDoc(photosCollection, {
        spotId,
        storagePath,
        downloadUrl,
        thumbnailStoragePath,
        thumbnailUrl,
        uploadedAt: serverTimestamp(),
      })
    }),
  )
}

export async function getPhotosForSpot(spotId: string): Promise<Photo[]> {
  const snapshot = await getDocs(
    query(photosCollection, where('spotId', '==', spotId)),
  )
  return snapshot.docs.map(photoFromDoc)
}

// Storage上の画像ファイル(フルサイズ+サムネイル)の削除のみを行う
// (Firestoreの写真ドキュメント自体は、呼び出し側でスポット/旅行の削除と
// まとめて1つのwriteBatchに含めることで、「一部だけ削除された」状態を
// 避ける)。既に無い/失敗したファイルがあっても全体の削除操作は続行できる
// よう、ここではエラーを握りつぶす。旧データはthumbnailStoragePathが
// storagePathと同じ値にフォールバックしているため、二重削除を避ける。
export async function deletePhotoFiles(photos: Photo[]): Promise<void> {
  await Promise.all(
    photos.flatMap((photo) => {
      const paths = new Set([photo.storagePath, photo.thumbnailStoragePath])
      return Array.from(paths).map((path) =>
        deleteObject(ref(storage, path)).catch(() => {}),
      )
    }),
  )
}

export async function listPhotosBySpotId(): Promise<Map<string, Photo[]>> {
  const snapshot = await getDocs(photosCollection)
  const bySpotId = new Map<string, Photo[]>()

  snapshot.docs.forEach((doc) => {
    const photo = photoFromDoc(doc)
    const existing = bySpotId.get(photo.spotId)
    if (existing) {
      existing.push(photo)
    } else {
      bySpotId.set(photo.spotId, [photo])
    }
  })

  return bySpotId
}
