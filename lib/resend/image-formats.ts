/** Client-safe image composer constants; generation and S3 stay server-only. */
export const EMAIL_IMAGE_FORMATS = ["wide", "square", "portrait"] as const
export type EmailImageFormat = (typeof EMAIL_IMAGE_FORMATS)[number]
export const MAX_REFERENCES = 4
