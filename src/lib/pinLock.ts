// PINコード(4桁)をFirestoreに平文で保存しないための処理。
// 4桁PIN(1万通り)は総当たりされやすいため、単純なSHA-256の1回適用ではなく、
// PBKDF2(意図的に低速なハッシュ関数)でストレッチングする。反復回数は
// Web Crypto APIのネイティブ実装であれば端末上でも数百ms程度で収まる範囲で、
// かつ十分に総当たりを遅くできる210,000回とした。
const PBKDF2_ITERATIONS = 210_000
const HASH_BITS = 256

export function generateSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return bytesToHex(bytes)
}

async function derivePinHash(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    HASH_BITS,
  )
  return bytesToHex(new Uint8Array(derivedBits))
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  return derivePinHash(pin, salt)
}

export async function verifyPin(
  pin: string,
  salt: string,
  expectedHash: string,
): Promise<boolean> {
  const hash = await derivePinHash(pin, salt)
  return hash === expectedHash
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
