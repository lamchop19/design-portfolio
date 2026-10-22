/*
 * Ordered dithering, shared by everything that prints a bitmap: the bitmap
 * prototype's specimens (src/app/prototypes/_bitmap/dither.ts), the ocean
 * wallpaper's plates (scripts/generate-specimens.tsx) and the water texture.
 * Pure functions on typed arrays, so the browser and the build scripts print
 * exactly the same pixels.
 */

/** 8 × 8 Bayer thresholds, 0–1, row-major. */
export const BAYER = (() => {
  const base = [
    [0, 32, 8, 40, 2, 34, 10, 42],
    [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44, 4, 36, 14, 46, 6, 38],
    [60, 28, 52, 20, 62, 30, 54, 22],
    [3, 35, 11, 43, 1, 33, 9, 41],
    [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47, 7, 39, 13, 45, 5, 37],
    [63, 31, 55, 23, 61, 29, 53, 21],
  ]
  return Float32Array.from(base.flat(), (n) => (n + 0.5) / 64)
})()

/** The Bayer threshold at pixel (x, y). */
export const bayerAt = (x: number, y: number) => BAYER[(y & 7) * 8 + (x & 7)]

/**
 * Prints a coverage map (0 = bare paper, 1 = solid ink) as one ink: each
 * pixel is inked where its coverage beats the Bayer threshold. Writes alpha
 * only (0 or 255) into `out`, RGBA, so the result can be used as a mask and
 * tinted with any ink in CSS.
 */
export function ditherToAlpha(out: Uint8ClampedArray, coverage: Float32Array, width: number, height: number) {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      const o = i * 4
      out[o] = out[o + 1] = out[o + 2] = 0
      out[o + 3] = coverage[i] > bayerAt(x, y) ? 255 : 0
    }
  }
}

/* ---- Seeded randomness, so a seed always draws the same thing ---- */

/** FNV-1a: a string to a 32-bit seed. */
export function hashString(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** A small, fast seeded generator: returns a function giving 0–1. */
export function mulberry32(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
