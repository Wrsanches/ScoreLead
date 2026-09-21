import { expect, test } from "bun:test"
import sharp, { type Sharp } from "sharp"
import { analyzeLogoContrast } from "./logo-contrast"

async function analyze(img: Sharp) {
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return analyzeLogoContrast(data, info.width, info.height)
}

async function markOnTransparent(color: { r: number; g: number; b: number }) {
  // 32x32 transparent canvas with a 16x16 solid square in the middle.
  const square = await sharp({
    create: { width: 16, height: 16, channels: 4, background: { ...color, alpha: 1 } },
  })
    .png()
    .toBuffer()
  return sharp({ create: { width: 32, height: 32, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: square, left: 8, top: 8 }])
    .png()
}

test("dark mark on a transparent background needs a light backing", async () => {
  const result = await analyze(await (await markOnTransparent({ r: 20, g: 20, b: 20 })).toBuffer().then(sharp))
  expect(result.transparentFraction).toBeGreaterThan(0.5)
  expect(result.meanLuminance).toBeLessThan(0.2)
  expect(result.needsLightBacking).toBe(true)
})

test("light mark on a transparent background is left alone", async () => {
  const result = await analyze(await (await markOnTransparent({ r: 240, g: 240, b: 240 })).toBuffer().then(sharp))
  expect(result.needsLightBacking).toBe(false)
})

test("opaque image brings its own background and is left alone", async () => {
  const opaque = sharp({ create: { width: 32, height: 32, channels: 3, background: { r: 10, g: 10, b: 10 } } }).png()
  const result = await analyze(await opaque.toBuffer().then(sharp))
  expect(result.transparentFraction).toBe(0)
  expect(result.needsLightBacking).toBe(false)
})

test("saturated brand color on transparent background is left alone", async () => {
  const result = await analyze(await (await markOnTransparent({ r: 16, g: 185, b: 129 })).toBuffer().then(sharp))
  expect(result.needsLightBacking).toBe(false)
})
