import { GetObjectCommand } from "@aws-sdk/client-s3"
import sharp from "sharp"
import { getBucket, getS3, keyFromUrl, putObject, deleteObject } from "@/lib/s3"
import { PublishingError } from "./validation"

export async function normalizeInstagramImage(input: Buffer) {
  if (input.length > 8 * 1024 * 1024)
    throw new PublishingError("IMAGE_TOO_LARGE")
  const image = sharp(input, { limitInputPixels: 40_000_000 })
  const metadata = await image.metadata()
  if (
    !["jpeg", "png", "webp"].includes(metadata.format || "") ||
    (metadata.pages || 1) > 1
  )
    throw new PublishingError("INVALID_IMAGE")
  // Preserve the complete picture and strip EXIF. Uniform 4:5 frames avoid
  // Instagram cropping later carousel slides differently from the first one.
  return image
    .autoOrient()
    .resize(1080, 1350, { fit: "contain", background: "#ffffff" })
    .flatten({ background: "#ffffff" })
    .toColourspace("srgb")
    .jpeg({ quality: 90 })
    .toBuffer()
}
export async function preparePublicationImages(
  publicationId: string,
  postId: string,
  urls: string[],
) {
  const prepared: string[] = []
  try {
    for (let index = 0; index < urls.length; index++) {
      const sourceKey = keyFromUrl(urls[index])
      // Read only the authenticated post's stored objects, never arbitrary URLs.
      if (
        !sourceKey?.startsWith(`content/${postId}/`) ||
        sourceKey.includes("..") ||
        sourceKey.includes("%")
      )
        throw new PublishingError("INVALID_IMAGE")
      const result = await getS3().send(
        new GetObjectCommand({ Bucket: getBucket(), Key: sourceKey }),
        { abortSignal: AbortSignal.timeout(15_000) },
      )
      if (
        !result.Body ||
        !result.ContentLength ||
        result.ContentLength > 8 * 1024 * 1024
      )
        throw new PublishingError("IMAGE_TOO_LARGE")
      const bytes = await result.Body.transformToByteArray()
      const body = await normalizeInstagramImage(Buffer.from(bytes))
      prepared.push(
        await putObject({
          key: `instagram-publications/${publicationId}/${index}.jpg`,
          body,
          contentType: "image/jpeg",
        }),
      )
    }
    return prepared
  } catch (error) {
    await removePublicationImages(prepared)
    if (error instanceof PublishingError) throw error
    throw new PublishingError("IMAGE_PREPARATION_FAILED")
  }
}
export async function removePublicationImages(urls: string[]) {
  await Promise.all(
    urls.map((url) => {
      const key = keyFromUrl(url)
      return key?.startsWith("instagram-publications/")
        ? deleteObject(key)
        : Promise.resolve()
    }),
  )
}
