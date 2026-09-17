// このアプリはサーバーを持たないPWAのため、WebAuthnの署名検証をサーバー側で
// 行うことができない。ここでは「同じ端末に登録されたプラットフォーム認証器
// (Face ID/Touch ID等)による本人確認を、ブラウザ自身に保証させる」という
// 簡易な使い方に留める。navigator.credentials.get() が成功した時点で、
// OS/ブラウザが生体認証によるユーザー検証(userVerification: 'required')を
// 終えていることが保証されるため、真のログイン認証(Firebase Authentication)
// とは別の「画面のぞき見防止」用途としてはこれで十分と判断している。
const RP_NAME = 'COTABI'

export async function isWebAuthnAvailable(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

export async function registerWebAuthnCredential(
  userId: string,
  userEmail: string,
): Promise<string> {
  const challenge = crypto.getRandomValues(new Uint8Array(32))

  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: RP_NAME },
      user: {
        id: new TextEncoder().encode(userId),
        name: userEmail || userId,
        displayName: userEmail || RP_NAME,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    },
  })) as PublicKeyCredential | null

  if (!credential) {
    throw new Error('WebAuthn registration was cancelled')
  }
  return bufferToBase64Url(credential.rawId)
}

export async function verifyWebAuthnCredential(credentialId: string): Promise<boolean> {
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32))
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [
          {
            id: base64UrlToBuffer(credentialId),
            type: 'public-key',
            transports: ['internal'],
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      },
    })
    return !!assertion
  } catch {
    return false
  }
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBuffer(base64Url: string): ArrayBuffer {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}
