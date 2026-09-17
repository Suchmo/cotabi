const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.8

const THUMBNAIL_DIMENSION = 300
const THUMBNAIL_JPEG_QUALITY = 0.7

function resizeToBlob(
  bitmap: ImageBitmap,
  maxDimension: number,
  quality: number,
): Promise<Blob | null> {
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.resolve(null)
  ctx.drawImage(bitmap, 0, 0, width, height)

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
}

export type CompressedImage = {
  full: Blob
  thumbnail: Blob
}

// Firebase Storageの無料枠(Sparkプラン相当)を超えないよう、アップロード前に
// ブラウザ内で長辺1600px・JPEG品質0.8程度まで圧縮する。スマホカメラの写真
// (数MB)は大抵これで数百KB程度まで縮む。
//
// あわせて、一覧・サムネイル表示専用の小さい版(長辺300px)も生成する。
// 一覧画面の84px角サムネイル等にフル画像(1600px)をそのまま使うと、表示に
// 不要なサイズの画像を毎回ダウンロードすることになり遅くなるため。
export async function compressImage(file: File): Promise<CompressedImage> {
  const bitmap = await createImageBitmap(file)
  try {
    const [full, thumbnail] = await Promise.all([
      resizeToBlob(bitmap, MAX_DIMENSION, JPEG_QUALITY),
      resizeToBlob(bitmap, THUMBNAIL_DIMENSION, THUMBNAIL_JPEG_QUALITY),
    ])
    return { full: full ?? file, thumbnail: thumbnail ?? full ?? file }
  } finally {
    bitmap.close()
  }
}
