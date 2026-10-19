/**
 * The paint renderers, shared by the flora (generate-flora.tsx), the aquarium
 * (generate-aquarium.tsx) and the sea page (generate-sea.tsx): an airbrush,
 * and a watercolour wash.
 *
 * A drawing is SVG shapes grouped by ink role. Each role is rasterized whole
 * (no knockouts, so colours fog into each other), blurred, and laid over the
 * last in its colour; the accent also throws a wide glow. `grain` then adds
 * colour noise everywhere and a stochastic spray at soft edges, where an
 * airbrush leaves its speckle.
 *
 * Images are straight-alpha RGBA in Float32Arrays, 0–255 colour, 0–1 alpha.
 */
import sharp from 'sharp'

import { type Role, ROLES } from '../src/lib/flora'

export type Size = { width: number; height: number }
export type Layers = Partial<Record<Role, string[]>>
export type Image = { size: Size; data: Float32Array }

/** Per role: how soft the spray is (blur sigma, in px at a scale of 1) and how dense. */
export const SPRAY: Record<Role, { blur: number; strength: number }> = {
  base: { blur: 5, strength: 0.8 },
  stem: { blur: 2.4, strength: 0.85 },
  body: { blur: 4.5, strength: 0.92 },
  shade: { blur: 7, strength: 0.7 },
  accent: { blur: 3.5, strength: 0.95 },
  line: { blur: 1.4, strength: 0.5 },
  spot: { blur: 1.6, strength: 0.9 },
}

export function blank(size: Size): Image {
  return { size, data: new Float32Array(size.width * size.height * 4) }
}

const rgbOf = (hex: string) => {
  const c = Number.parseInt(hex.slice(1), 16)
  return [(c >> 16) & 255, (c >> 8) & 255, c & 255]
}

/** Lays `alpha` (one value per pixel) over `out` in one colour. */
export function paint(out: Image, alpha: Float32Array, hex: string, strength: number) {
  const rgb = rgbOf(hex)
  const { data } = out
  for (let i = 0; i < alpha.length; i++) {
    const a = alpha[i] * strength
    if (a <= 0.001) continue
    const o = i * 4
    const below = data[o + 3]
    const total = a + below * (1 - a)
    for (let k = 0; k < 3; k++) data[o + k] = (rgb[k] * a + data[o + k] * below * (1 - a)) / total
    data[o + 3] = total
  }
}

/** One role's shapes as a standalone SVG, `viewBox` units scaled to `size` px; `flip` mirrors it. */
export function svgDoc(shapes: string[], size: Size, viewBox: Size, flip = false) {
  const group = flip ? `<g transform="translate(${viewBox.width} 0) scale(-1 1)">${shapes.join('')}</g>` : shapes.join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${viewBox.width} ${viewBox.height}"><g fill="#000">${group}</g></svg>`
}

/** Rasterizes an SVG to its alpha, blurred by `sigma` px. */
export async function softAlpha(svg: string, size: Size, sigma: number) {
  const raw = await sharp(Buffer.from(svg)).ensureAlpha().extractChannel(3).raw().toBuffer()
  const blurred = sigma >= 0.3 ? await sharp(raw, { raw: { ...size, channels: 1 } }).blur(sigma).extractChannel(0).raw().toBuffer() : raw
  return Float32Array.from(blurred, (v) => v / 255)
}

/**
 * Airbrushes one drawing at `size` px. `scale` multiplies the blur, so a
 * small fish in the scene is as soft, relative to its size, as a large one.
 */
export async function airbrush(layers: Layers, colours: Partial<Record<Role, string>>, size: Size, viewBox: Size, { scale = 1, flip = false } = {}) {
  const out = blank(size)
  for (const role of ROLES) {
    const shapes = layers[role]
    const colour = colours[role]
    if (!shapes?.length || !colour) continue
    const svg = svgDoc(shapes, size, viewBox, flip)
    if (role === 'accent') paint(out, await softAlpha(svg, size, 14 * scale), colour, 0.45)
    paint(out, await softAlpha(svg, size, SPRAY[role].blur * scale), colour, SPRAY[role].strength)
  }
  return out
}

/** Composites `src` over `dst` with its top-left corner at (x, y), clipping at the edges. */
export function over(dst: Image, src: Image, x: number, y: number, opacity = 1) {
  const { width: dw, height: dh } = dst.size
  const { width: sw, height: sh } = src.size
  x = Math.round(x)
  y = Math.round(y)
  for (let sy = 0; sy < sh; sy++) {
    const ty = y + sy
    if (ty < 0 || ty >= dh) continue
    for (let sx = 0; sx < sw; sx++) {
      const tx = x + sx
      if (tx < 0 || tx >= dw) continue
      const s = (sy * sw + sx) * 4
      const a = src.data[s + 3] * opacity
      if (a <= 0.001) continue
      const d = (ty * dw + tx) * 4
      const below = dst.data[d + 3]
      const total = a + below * (1 - a)
      for (let k = 0; k < 3; k++) dst.data[d + k] = (src.data[s + k] * a + dst.data[d + k] * below * (1 - a)) / total
      dst.data[d + 3] = total
    }
  }
}

/**
 * Grain: colour noise everywhere and a spray at soft edges. `edge` is how far
 * alpha may scatter there (0 keeps it, about 1 sprays hard). Seeded, so a
 * re-run prints the same speckle.
 */
export function grain(image: Image, { noise = 22, edge = 1.1, seed = 0x9e3779b9 } = {}) {
  const { data } = image
  const out = new Uint8ClampedArray(data.length)
  let s = seed >>> 0 || 1
  const random = () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return (s >>> 0) / 4294967296
  }
  for (let o = 0; o < data.length; o += 4) {
    const a = data[o + 3]
    const fray = 4 * a * (1 - a)
    const sprayed = Math.min(1, Math.max(0, a + (random() - 0.5) * edge * fray))
    const tint = (random() - 0.5) * noise
    out[o] = data[o] + tint
    out[o + 1] = data[o + 1] + tint
    out[o + 2] = data[o + 2] + tint
    out[o + 3] = sprayed * 255
  }
  return out
}

/* ---- Watercolour ---- */

/** One wash: shapes laid in a single colour. */
export type Part = { shapes: string[]; colour: string; opacity?: number }

/** Blurs a per-pixel alpha map. */
async function blurArray(alpha: Float32Array, size: Size, sigma: number) {
  const raw = Buffer.from(Uint8Array.from(alpha, (v) => Math.round(Math.min(1, v) * 255)))
  const out = await sharp(raw, { raw: { ...size, channels: 1 } }).blur(sigma).extractChannel(0).raw().toBuffer()
  return Float32Array.from(out, (v) => v / 255)
}

/** Smooth value noise, 0–1, for the pigment's uneven settling. */
function valueNoise(seed: number) {
  const hash = (x: number, y: number) => {
    let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 2147483647)
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296
  }
  const fade = (t: number) => t * t * (3 - 2 * t)
  return (x: number, y: number) => {
    const x0 = Math.floor(x)
    const y0 = Math.floor(y)
    const fx = fade(x - x0)
    const fy = fade(y - y0)
    const top = hash(x0, y0) + (hash(x0 + 1, y0) - hash(x0, y0)) * fx
    const bottom = hash(x0, y0 + 1) + (hash(x0 + 1, y0 + 1) - hash(x0, y0 + 1)) * fx
    return top + (bottom - top) * fy
  }
}

/**
 * Watercolour: each part a flat wash with a crisp, slightly softened edge;
 * the pigment pools darker along that edge, as a wash does while it dries,
 * and settles unevenly across the middle (granulation). After the sailboat
 * and Life Aquatic references, rather than the airbrush's glow.
 */
export async function watercolour(parts: Part[], size: Size, viewBox: Size, { scale = 1, flip = false, seed = 1 } = {}) {
  const out = blank(size)
  const settle = valueNoise(seed)
  const fine = valueNoise(seed + 7)
  const { width, height } = size
  for (const part of parts) {
    if (!part.shapes.length) continue
    const alpha = await softAlpha(svgDoc(part.shapes, size, viewBox, flip), size, 0.6 * scale)
    const wet = await blurArray(alpha, size, 3.2 * scale)
    const rgb = rgbOf(part.colour)
    const opacity = part.opacity ?? 0.92
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x
        if (alpha[i] <= 0.004) continue
        const edge = Math.min(1, Math.max(0, (alpha[i] - wet[i]) * 2.6))
        const pigment = 0.72 + 0.22 * settle(x / (22 * scale), y / (22 * scale)) + 0.06 * fine(x / 3, y / 3)
        const a = alpha[i] * opacity * Math.min(1, pigment + edge * 0.25)
        const o = i * 4
        const below = out.data[o + 3]
        const total = a + below * (1 - a)
        for (let k = 0; k < 3; k++) {
          const c = rgb[k] * (1 - 0.34 * edge)
          out.data[o + k] = (c * a + out.data[o + k] * below * (1 - a)) / total
        }
        out.data[o + 3] = total
      }
    }
  }
  return out
}

export async function toWebp(rgba: Uint8ClampedArray, size: Size, quality = 82) {
  return sharp(Buffer.from(rgba.buffer), { raw: { ...size, channels: 4 } })
    .webp({ quality, alphaQuality: 90, effort: 6 })
    .toBuffer()
}
