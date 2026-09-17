// PINコード(4桁)をFirestoreに平文で保存しないための簡易ハッシュ処理。
// ソルト(端末ごとではなくユーザーごとに1つ発行)とPINを連結してSHA-256を取り、
// ハッシュ値のみを保存する。ロック解除時は同じ手順でハッシュ化して比較する。
export function generateSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return bytesToHex(bytes)
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pin}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return bytesToHex(new Uint8Array(digest))
}

export async function verifyPin(
  pin: string,
  salt: string,
  expectedHash: string,
): Promise<boolean> {
  const hash = await hashPin(pin, salt)
  return hash === expectedHash
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
