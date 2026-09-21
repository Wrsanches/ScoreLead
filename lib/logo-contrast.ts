/**
 * Decides whether a logo needs a light surface behind it when shown on the
 * dark admin canvas. Logos are drawn for white pages, so a dark mark on a
 * transparent background disappears on our dark UI. Opaque images bring their
 * own background and are left alone.
 */

export interface LogoContrast {
  /** Share of pixels that are (mostly) transparent, 0..1. */
  transparentFraction: number
  /** Mean relative luminance of the opaque pixels, 0..1. */
  meanLuminance: number
  /** True when the mark is dark and sits on a transparent background. */
  needsLightBacking: boolean
}

/** Alpha at or below this counts as transparent (0..255). */
const TRANSPARENT_ALPHA = 64
/** Below this share of transparent pixels the image has its own backdrop. */
const MIN_TRANSPARENT_FRACTION = 0.05
/** Opaque pixels darker than this on average are hard to read on the canvas. */
const DARK_LUMINANCE = 0.4

/**
 * `rgba` is tightly packed 8-bit RGBA, as sharp's `.ensureAlpha().raw()` emits.
 */
export function analyzeLogoContrast(rgba: Uint8Array | Buffer, width: number, height: number): LogoContrast {
  const total = width * height
  if (total === 0 || rgba.length < total * 4) {
    return { transparentFraction: 0, meanLuminance: 1, needsLightBacking: false }
  }

  let transparent = 0
  let lumSum = 0
  let opaque = 0

  for (let i = 0; i < total * 4; i += 4) {
    const a = rgba[i + 3]
    if (a <= TRANSPARENT_ALPHA) {
      transparent++
      continue
    }
    const r = rgba[i] / 255
    const g = rgba[i + 1] / 255
    const b = rgba[i + 2] / 255
    lumSum += 0.2126 * r + 0.7152 * g + 0.0722 * b
    opaque++
  }

  const transparentFraction = transparent / total
  const meanLuminance = opaque > 0 ? lumSum / opaque : 1

  return {
    transparentFraction,
    meanLuminance,
    needsLightBacking:
      transparentFraction >= MIN_TRANSPARENT_FRACTION && meanLuminance < DARK_LUMINANCE,
  }
}
