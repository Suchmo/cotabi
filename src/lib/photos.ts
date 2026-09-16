import { addDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
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
