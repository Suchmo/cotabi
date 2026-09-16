const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.8

// Firebase Storageの無料枠(Sparkプラン相当)を超えないよう、
// アップロード前にブラウザ内で長辺1600px・JPEG品質0.8程度まで圧縮する。
// スマホカメラの写真(数MB)は大抵これで数百KB程度まで縮む。
export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)

  const scale = Math.min(
    1,
    MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
  )
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return file
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
  )

  return blob ?? file
}
