// PIN入力の連続失敗回数を端末に保存し、一定回数を超えたら一時的に
// ロックアウトする(総当たり対策)。ページの再読み込みだけで回避されない
// よう、React stateではなくlocalStorageに永続化する。
export const MAX_PIN_ATTEMPTS = 5
export const PIN_LOCKOUT_MS = 30_000

type AttemptState = {
  count: number
  lockedUntil: number | null
}

function storageKey(uid: string): string {
  return `cotabi:pinAttempts:${uid}`
}

function loadAttemptState(uid: string): AttemptState {
  try {
    const raw = localStorage.getItem(storageKey(uid))
    if (!raw) return { count: 0, lockedUntil: null }
    const parsed = JSON.parse(raw) as Partial<AttemptState>
    return {
      count: typeof parsed.count === 'number' ? parsed.count : 0,
      lockedUntil: typeof parsed.lockedUntil === 'number' ? parsed.lockedUntil : null,
    }
  } catch {
    return { count: 0, lockedUntil: null }
  }
}

function saveAttemptState(uid: string, state: AttemptState): void {
  try {
    localStorage.setItem(storageKey(uid), JSON.stringify(state))
  } catch {
    // localStorageが使えない環境(プライベートブラウジング等)では
    // 試行制限自体を諦める(ロックアウトできないだけで、機能自体は動く)。
  }
}

// 現在ロックアウト中であれば、その解除時刻(epoch ms)を返す。
export function getLockedUntil(uid: string): number | null {
  const state = loadAttemptState(uid)
  if (state.lockedUntil && state.lockedUntil > Date.now()) {
    return state.lockedUntil
  }
  return null
}

// PIN入力に失敗した直後に呼ぶ。上限に達していればロックアウトを開始し、
// その解除時刻を返す(達していなければnull)。
export function recordFailedAttempt(uid: string): number | null {
  const state = loadAttemptState(uid)
  const nextCount = state.count + 1
  if (nextCount >= MAX_PIN_ATTEMPTS) {
    const lockedUntil = Date.now() + PIN_LOCKOUT_MS
    saveAttemptState(uid, { count: 0, lockedUntil })
    return lockedUntil
  }
  saveAttemptState(uid, { count: nextCount, lockedUntil: null })
  return null
}

export function clearAttempts(uid: string): void {
  try {
    localStorage.removeItem(storageKey(uid))
  } catch {
    // 無視してよい(そもそも保存できていなければ消す必要もない)
  }
}
