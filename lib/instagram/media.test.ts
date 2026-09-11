import { expect, test } from "bun:test"
import sharp from "sharp"
import { normalizeInstagramImage } from "./media"
test("normalizes transparent PNG and WebP to bounded sRGB JPEG without cropping", async () => {
  for (const format of ["png", "webp"] as const) {
    const source = await sharp({
      create: {
        width: 600,
        height: 300,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 0.5 },
      },
    })
      .toFormat(format)
      .toBuffer()
    const output = await normalizeInstagramImage(source)
    const metadata = await sharp(output).metadata()
    expect(metadata.format).toBe("jpeg")
    expect(metadata.width).toBe(1080)
    expect(metadata.height).toBe(1350)
    expect(metadata.hasAlpha).toBe(false)
    expect(metadata.space).toBe("srgb")
    expect(metadata.exif).toBeUndefined()
  }
})
test("rejects oversized or non-image content", async () => {
  await expect(
    normalizeInstagramImage(Buffer.alloc(8 * 1024 * 1024 + 1)),
  ).rejects.toThrow("IMAGE_TOO_LARGE")
  await expect(
    normalizeInstagramImage(Buffer.from("not an image")),
  ).rejects.toThrow()
})
