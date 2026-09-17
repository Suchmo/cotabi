import { getDocs, type CollectionReference, type QuerySnapshot } from 'firebase/firestore'

// TODO(将来の課題): これはあくまで応急処置的な軽量キャッシュ。records.ts /
// useVisitedLocations.ts などの主要画面が、trips/spots/photosの各コレクションを
// 画面ごとに(時にはonEffect1回の中で複数回)全件取得している設計そのものは
// まだ残っている。本格的には、onSnapshotによる購読への切り替えや、必要な
// ドキュメントだけに絞ったクエリ設計への見直しを検討すること。
//
// ここでは、「同じ画面内でほぼ同時に複数箇所から呼ばれる」ケース
// (例: マップ画面が訪問済み判定用と思い出フラッシュバック用に、それぞれ
// spotsコレクション全件を取りに行く)に限定して、短いTTLの間は結果の
// Promiseを使い回すことでFirestoreへの往復回数を減らす。
const CACHE_TTL_MS = 3000

type CacheEntry = {
  expiresAt: number
  promise: Promise<QuerySnapshot>
}

const cache = new Map<string, CacheEntry>()

// cacheKeyはコレクションパス相当の文字列(例: 'trips')。同じFirestore
// コレクションを指していれば、呼び出し元のCollectionReferenceインスタンスが
// 別オブジェクトでも(ファイルをまたいでいても)キャッシュを共有できる。
export function getDocsCached(
  cacheKey: string,
  collectionRef: CollectionReference,
): Promise<QuerySnapshot> {
  const cached = cache.get(cacheKey)
  const now = Date.now()
  if (cached && cached.expiresAt > now) {
    return cached.promise
  }

  const promise = getDocs(collectionRef)
  cache.set(cacheKey, { expiresAt: now + CACHE_TTL_MS, promise })
  // 失敗した場合はキャッシュに残さず、次の呼び出しですぐ再試行できるようにする。
  promise.catch(() => cache.delete(cacheKey))
  return promise
}

// 該当コレクションへの書き込み(作成・更新・削除)を行った直後に呼び、
// TTL内でも古い結果を返し続けてしまわないようにする。
export function invalidateDocsCache(cacheKey: string): void {
  cache.delete(cacheKey)
}
