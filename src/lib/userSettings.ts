import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

// USER単位の端末ロック設定。screen_design_v4.md のUSER/TRIP/SPOT/PHOTOとは別に、
// Phase2のプライバシーロック用として users/{uid} に保持する。
export type UserLockSettings = {
  lockEnabled: boolean
  pinHash: string | null
  pinSalt: string | null
  webauthnCredentialId: string | null
}

const DEFAULT_LOCK_SETTINGS: UserLockSettings = {
  lockEnabled: false,
  pinHash: null,
  pinSalt: null,
  webauthnCredentialId: null,
}

export async function getUserLockSettings(uid: string): Promise<UserLockSettings> {
  const snapshot = await getDoc(doc(db, 'users', uid))
  if (!snapshot.exists()) return DEFAULT_LOCK_SETTINGS

  const data = snapshot.data()
  return {
    lockEnabled: data.lockEnabled ?? false,
    pinHash: data.pinHash ?? null,
    pinSalt: data.pinSalt ?? null,
    webauthnCredentialId: data.webauthnCredentialId ?? null,
  }
}

export async function updateUserLockSettings(
  uid: string,
  patch: Partial<UserLockSettings>,
): Promise<void> {
  await setDoc(doc(db, 'users', uid), patch, { merge: true })
}
