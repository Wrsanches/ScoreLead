import { Temporal } from "@js-temporal/polyfill"

export class PublishingError extends Error {
  constructor(
    public code: string,
    public status = 400,
  ) {
    super(code)
  }
}
export { publicationLocksPost } from "./status"
export function publishingCaption(caption: string, hashtags: string[] | null) {
  const tags = (hashtags || [])
    .map((tag) => tag.trim().replace(/^#+/, ""))
    .filter(Boolean)
  if (tags.some((tag) => /\s/.test(tag)))
    throw new PublishingError("INVALID_HASHTAG")
  const result = [caption.trim(), tags.map((tag) => `#${tag}`).join(" ")]
    .filter(Boolean)
    .join("\n\n")
  if ([...result].length > 2200 || tags.length > 30)
    throw new PublishingError("CAPTION_TOO_LONG")
  return result
}
export function validateSchedule(
  iso: string,
  timeZone: string,
  now = new Date(),
) {
  try {
    const instant = Temporal.Instant.from(iso)
    const zoned = instant.toZonedDateTimeISO(timeZone)
    // Reject ambiguous local times so a repeated DST hour is never silently chosen.
    Temporal.ZonedDateTime.from(`${zoned.toPlainDateTime()}[${timeZone}]`, {
      disambiguation: "reject",
    })
    const date = new Date(Number(instant.epochMilliseconds))
    if (date.getTime() < now.getTime() + 60_000)
      throw new PublishingError("SCHEDULE_IN_FUTURE")
    if (date.getTime() > now.getTime() + 365 * 86400_000)
      throw new PublishingError("SCHEDULE_TOO_FAR")
    return date
  } catch (error) {
    if (error instanceof PublishingError) throw error
    throw new PublishingError("INVALID_SCHEDULE")
  }
}
export function validatePost(post: {
  postType: string
  caption: string
  hashtags: string[] | null
  images: { url: string }[] | null
}) {
  if (!["single", "carousel"].includes(post.postType))
    throw new PublishingError("UNSUPPORTED_POST_TYPE")
  const images = post.images || []
  if (post.postType === "single" && images.length !== 1)
    throw new PublishingError("SINGLE_IMAGE_REQUIRED")
  if (post.postType === "carousel" && (images.length < 2 || images.length > 10))
    throw new PublishingError("CAROUSEL_IMAGE_COUNT")
  if (images.some((image) => !image?.url))
    throw new PublishingError("IMAGE_REQUIRED")
  return { caption: publishingCaption(post.caption, post.hashtags), images }
}
