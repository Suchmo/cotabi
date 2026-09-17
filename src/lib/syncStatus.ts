import { waitForPendingWrites } from 'firebase/firestore'
import { db } from './firebase'

// 保存直後に呼ぶと、その書き込みが実際にサーバーへ同期されたかを判定できる。
// waitForPendingWrites()は保留中の書き込みが全て確認される(成功/失敗を問わず
// サーバーとの往復が完了する)までを待つため、電波が無い間は解決しない。
// オフラインのまま無限に待たせないよう、一定時間で諦めて「未同期」とみなす
// (Firestoreのローカルキャッシュには書き込み済みなので、データ自体は失われず、
// 電波が戻れば自動的に同期される)。
const SYNC_CHECK_TIMEOUT_MS = 5000

export async function isFullySynced(): Promise<boolean> {
  let timedOut = false
  const timeout = new Promise<void>((resolve) => {
    setTimeout(() => {
      timedOut = true
      resolve()
    }, SYNC_CHECK_TIMEOUT_MS)
  })

  await Promise.race([waitForPendingWrites(db), timeout])
  return !timedOut
}
