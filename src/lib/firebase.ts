import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

// オフライン閲覧要件(電波が無い状態でも過去に見た記録を閲覧できる)のため、
// IndexedDBによる永続キャッシュを有効化する。一度オンラインで読み込んだ
// ドキュメントは、getDocs()等の通常の読み取りでもオフライン時に自動で
// キャッシュから返される(コード側の書き換えは不要)。プライベートブラウジング
// 等でIndexedDBが使えない環境では、通常のFirestoreインスタンスにフォールバックする。
let firestore
try {
  firestore = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  })
} catch {
  firestore = getFirestore(app)
}
export const db = firestore

export const storage = getStorage(app)
