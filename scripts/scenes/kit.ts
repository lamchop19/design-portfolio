/**
 * The scene painter: the airbrush renderer (../airbrush.ts) grown into whole
 * scenes, after Hiroshi Nagai's covers and the aquarium. A scene is painted
 * back to front on one canvas:
 *
 * - `svg` lays full-colour SVG (skies, gradients, several fills) straight in;
 * - `shape` lays shapes in one colour, softened a little, so a silhouette has
 *   Nagai's crisp edge with the airbrush's speckle at its rim;
 * - `soft` lays very soft shapes (haze, glow, light) blurred small and scaled up;
 * - `dots` and `rects` write speckle, sparkle and lit windows straight into
 *   the pixels, which is where the dot screen of the maL mark comes in;
 * - `finish` grains the whole picture once, so it reads as one sprayed surface.
 *
 * Everything is seeded from the scene's name, so a re-run paints the same
 * picture. Images are straight-alpha RGBA in Float32Arrays, 0–255 colour, 0–1
 * alpha, as in the airbrush.
 */
import sharp from 'sharp'

import { hashString, mulberry32 } from '../../src/lib/dither'
import { blank, grain, type Image, paint, type Size, softAlpha } from '../airbrush'

export type { Image, Size }

export type Dot = { x: number; y: number; r: number; colour: string; alpha?: number }
export type Rect = { x: number; y: number; w: number; h: number; colour: string; alpha?: number }

/** A dot that twinkles over the still on the site: x, y and r as fractions of the width (y of the height). */
export type Twinkle = [x: number, y: number, r: number, colour: string]

/** A separate transparent layer that moves over the still (an aeroplane, a school of fish). */
export type Sprite = { file: string; x: number; y: number; w: number; motion: 'fly' | 'drift' | 'bob' | 'sway'; speed?: number }

/** A region the site can label or link over the still (a shop sign), as fractions of width and height. */
export type Hotspot = { id: string; x: number; y: number; w: number; h: number }

export type Motion = { twinkles?: Twinkle[]; sprites?: Sprite[]; hotspots?: Hotspot[] }

export const rgbOf = (hex: string): [number, number, number] => {
  const c = Number.parseInt(hex.slice(1, 7), 16)
  return [(c >> 16) & 255, (c >> 8) & 255, c & 255]
}

/** Mixes two hex colours, `t` of the way from `a` to `b`. */
export function mix(a: string, b: string, t: number) {
  const [r1, g1, b1] = rgbOf(a)
  const [r2, g2, b2] = rgbOf(b)
  const c = (x: number, y: number) => Math.round(x + (y - x) * t)
  return `#${[c(r1, r2), c(g1, g2), c(b1, b2)].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

/** A vertical gradient as SVG stops: [offset 0–1, colour] pairs. */
export const stops = (list: Array<[number, string]>) => list.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')

export class Canvas {
  readonly size: Size
  readonly W: number
  readonly H: number
  /** The shorter side: lengths that should read the same in any shape of canvas. */
  readonly unit: number
  readonly img: Image
  readonly random: () => number
  private ids = 0

  constructor(size: Size, seed: string) {
    this.size = size
    this.W = size.width
    this.H = size.height
    this.unit = Math.min(size.width, size.height)
    this.img = blank(size)
    this.random = mulberry32(hashString(seed))
  }

  between(lo: number, hi: number) {
    return lo + this.random() * (hi - lo)
  }

  pick<T>(list: readonly T[]): T {
    return list[Math.floor(this.random() * list.length)]
  }

  chance(p: number) {
    return this.random() < p
  }

  /** A unique id for gradients and clips inside one SVG layer. */
  id(prefix = 'g') {
    return `${prefix}${++this.ids}`
  }

  private doc(inner: string, size = this.size) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${this.W} ${this.H}">${inner}</svg>`
  }

  /** Lays a full-colour SVG layer over the picture (its own fills and gradients), softened by `blur` px. */
  async svg(inner: string, { blur = 0, opacity = 1 } = {}) {
    let pipeline = sharp(Buffer.from(this.doc(inner))).ensureAlpha()
    if (blur >= 0.3) pipeline = pipeline.blur(blur)
    const raw = await pipeline.raw().toBuffer()
    const { data } = this.img
    for (let i = 0, n = this.W * this.H; i < n; i++) {
      const o = i * 4
      const a = (raw[o + 3] / 255) * opacity
      if (a <= 0.001) continue
      const below = data[o + 3]
      const total = a + below * (1 - a)
      for (let k = 0; k < 3; k++) data[o + k] = (raw[o + k] * a + data[o + k] * below * (1 - a)) / total
      data[o + 3] = total
    }
  }

  /** The alpha of some shapes (any fill), blurred by `blur` px: for masks and densities. */
  async mask(inner: string, blur = 0) {
    return softAlpha(this.doc(`<g fill="#000" stroke="#000">${inner}</g>`), this.size, blur)
  }

  /** Lays shapes in one colour. A blur of about 1–2 px keeps Nagai's crisp edge with an airbrushed rim. */
  async shape(inner: string, colour: string, { blur = 1.2, opacity = 1 } = {}) {
    paint(this.img, await this.mask(inner, blur), colour, opacity)
  }

  /** Lays a very soft shape (haze, glow, light), drawn and blurred small, then scaled up. */
  async soft(inner: string, colour: string, sigma: number, opacity = 1) {
    paint(this.img, await this.softMask(inner, sigma), colour, opacity)
  }

  async softMask(inner: string, sigma: number) {
    const factor = Math.max(1, Math.floor(sigma / 6))
    const small = { width: Math.ceil(this.W / factor), height: Math.ceil(this.H / factor) }
    const raw = await sharp(Buffer.from(this.doc(`<g fill="#000">${inner}</g>`, small)))
      .ensureAlpha()
      .extractChannel(3)
      .raw()
      .toBuffer()
    const blurred = await sharp(raw, { raw: { ...small, channels: 1 } })
      .blur(Math.max(0.3, sigma / factor))
      .resize(this.W, this.H, { kernel: 'cubic' })
      .extractChannel(0)
      .raw()
      .toBuffer()
    return Float32Array.from(blurred, (v) => v / 255)
  }

  /** Lays a per-pixel alpha (from `mask` or made by hand) in one colour. */
  paintMask(alpha: Float32Array, colour: string, opacity = 1) {
    paint(this.img, alpha, colour, opacity)
  }

  /** Antialiased discs straight into the pixels: speckle, sparkle, lights, flowers. */
  dots(list: Dot[]) {
    const { data } = this.img
    const { W, H } = this
    for (const d of list) {
      const [cr, cg, cb] = rgbOf(d.colour)
      const alpha = d.alpha ?? 1
      const x0 = Math.max(0, Math.floor(d.x - d.r - 1))
      const x1 = Math.min(W - 1, Math.ceil(d.x + d.r + 1))
      const y0 = Math.max(0, Math.floor(d.y - d.r - 1))
      const y1 = Math.min(H - 1, Math.ceil(d.y + d.r + 1))
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const cover = Math.min(1, Math.max(0, d.r + 0.5 - Math.hypot(x + 0.5 - d.x, y + 0.5 - d.y)))
          const a = cover * alpha
          if (a <= 0.002) continue
          const o = (y * W + x) * 4
          const below = data[o + 3]
          const total = a + below * (1 - a)
          data[o] = (cr * a + data[o] * below * (1 - a)) / total
          data[o + 1] = (cg * a + data[o + 1] * below * (1 - a)) / total
          data[o + 2] = (cb * a + data[o + 2] * below * (1 - a)) / total
          data[o + 3] = total
        }
      }
    }
  }

  /** Rectangles straight into the pixels (lit windows, tiles), with soft sub-pixel edges. */
  rects(list: Rect[]) {
    const { data } = this.img
    const { W, H } = this
    for (const r of list) {
      const [cr, cg, cb] = rgbOf(r.colour)
      const alpha = r.alpha ?? 1
      const x0 = Math.max(0, Math.floor(r.x))
      const x1 = Math.min(W - 1, Math.ceil(r.x + r.w))
      const y0 = Math.max(0, Math.floor(r.y))
      const y1 = Math.min(H - 1, Math.ceil(r.y + r.h))
      for (let y = y0; y <= y1; y++) {
        const cy = Math.min(1, Math.max(0, Math.min(y + 1, r.y + r.h) - Math.max(y, r.y)))
        for (let x = x0; x <= x1; x++) {
          const cx = Math.min(1, Math.max(0, Math.min(x + 1, r.x + r.w) - Math.max(x, r.x)))
          const a = cx * cy * alpha
          if (a <= 0.002) continue
          const o = (y * W + x) * 4
          const below = data[o + 3]
          const total = a + below * (1 - a)
          data[o] = (cr * a + data[o] * below * (1 - a)) / total
          data[o + 1] = (cg * a + data[o + 1] * below * (1 - a)) / total
          data[o + 2] = (cb * a + data[o + 2] * below * (1 - a)) / total
          data[o + 3] = total
        }
      }
    }
  }

  /**
   * Scatters up to `count` dots where `density(x, y)` (0–1) allows: tries
   * random points and keeps each with that probability. Returns the dots,
   * unpainted, so a scene can colour, size and sort them first.
   */
  scatter(count: number, density: (x: number, y: number) => number, make: (x: number, y: number) => Omit<Dot, 'x' | 'y'>, area = { x: 0, y: 0, w: this.W, h: this.H }) {
    const out: Dot[] = []
    let tries = 0
    while (out.length < count && tries < count * 40) {
      tries++
      const x = area.x + this.random() * area.w
      const y = area.y + this.random() * area.h
      if (this.random() < density(x, y)) out.push({ x, y, ...make(x, y) })
    }
    return out
  }

  /** Density from a mask: the mask's value at (x, y), raised to `gamma` to tighten or loosen it. */
  sampler(alpha: Float32Array, gamma = 1) {
    return (x: number, y: number) => {
      const i = Math.floor(y) * this.W + Math.floor(x)
      const v = alpha[i] ?? 0
      return gamma === 1 ? v : Math.pow(v, gamma)
    }
  }

  /**
   * Stipple: the sprayed speckle of an airbrushed gradient. Sparse specks a
   * shade darker and lighter than what's under them, inside `area`.
   */
  stipple(area: { x: number; y: number; w: number; h: number }, { per = 0.004, dark = '#000000', light = '#ffffff', darkAlpha = 0.18, lightAlpha = 0.14, r = [0.5, 1.1] as [number, number] } = {}) {
    const n = Math.round(area.w * area.h * per)
    const list: Dot[] = []
    for (let i = 0; i < n; i++) {
      const isDark = this.random() < 0.6
      list.push({
        x: area.x + this.random() * area.w,
        y: area.y + this.random() * area.h,
        r: this.between(r[0], r[1]),
        colour: isDark ? dark : light,
        alpha: (isDark ? darkAlpha : lightAlpha) * this.between(0.5, 1),
      })
    }
    this.dots(list)
  }

  /**
   * Grains the finished picture once: colour noise over everything. A scene
   * is opaque, so `edge` stays 0; a transparent layer (a sprite) sprays its rim.
   */
  finish({ noise = 16, edge = 0, seed = 'grain' } = {}) {
    return grain(this.img, { noise, edge, seed: hashString(seed) })
  }
}

/* ---- Shared props ---- */

/**
 * A palm, after Nagai: a tall trunk with a slight bow, rings down it, and a
 * crown of drooping fronds whose leaflets fan off one spine. Returns SVG for
 * three inks, so the crown can be dark with lighter leaflets on top.
 * `x`, `base` are the foot of the trunk; `top` is where the crown sits.
 */
export function palm(c: Canvas, { x, base, top, lean = 0, width, crown }: { x: number; base: number; top: number; lean?: number; width: number; crown: number }) {
  const tx = x + lean
  // Trunk: a tapered ribbon bowed by `lean`.
  const bow = lean * 0.35 + (top - base) * 0.04
  const w0 = width
  const w1 = width * 0.55
  const trunk = `<path d="M${x - w0 / 2} ${base} C ${x - w0 / 2 + bow} ${base + (top - base) * 0.45}, ${tx - w1 / 2 + bow * 0.4} ${top + (base - top) * 0.25}, ${tx - w1 / 2} ${top} L ${tx + w1 / 2} ${top} C ${tx + w1 / 2 + bow * 0.4} ${top + (base - top) * 0.25}, ${x + w0 / 2 + bow} ${base + (top - base) * 0.45}, ${x + w0 / 2} ${base} Z"/>`
  // Rings down the trunk's centre line, the same curve as its outline, so
  // they stay on it however far it bows.
  const spine = [
    [x, base],
    [x + bow, base + (top - base) * 0.45],
    [tx + bow * 0.4, top + (base - top) * 0.25],
    [tx, top],
  ]
  let rings = ''
  const ringCount = Math.round((base - top) / (width * 0.9))
  for (let i = 1; i < ringCount; i++) {
    const t = i / ringCount
    const u = 1 - t
    const k = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t]
    const cx = k.reduce((sum, weight, j) => sum + weight * spine[j][0], 0)
    const y = k.reduce((sum, weight, j) => sum + weight * spine[j][1], 0)
    const w = (w0 + (w1 - w0) * t) * 0.92
    rings += `<path d="M${cx - w / 2} ${y} Q ${cx} ${y + w * 0.2} ${cx + w / 2} ${y}" fill="none" stroke-width="${Math.max(1, w * 0.09)}"/>`
  }
  // Crown: a fountain of fronds. Each rises from the top on an arch and falls
  // away, upright ones least; leaflets hang off both sides of its spine,
  // longest mid-frond, swept forward and pulled down, so each frond reads as a
  // drooping feather. Leaflets on a frond's upper side catch the light.
  let back = ''
  let fronds = ''
  let leaflets = ''
  const count = 22
  for (let i = 0; i < count; i++) {
    const behind = i % 3 === 1
    // From left and a little below the horizontal, over the top, to the right.
    const a = Math.PI - 0.32 + ((Math.PI + 0.64) * i) / (count - 1) + c.between(-0.06, 0.06)
    const len = crown * c.between(0.72, 1.08) * (behind ? 0.86 : 1)
    const cos = Math.cos(a)
    const sin = Math.sin(a)
    // How upright the frond starts: 0 sideways or below, 1 straight up. Upright
    // fronds stand like a fountain; sideways ones arch and fall.
    const up = Math.max(0, -sin)
    const p0 = [tx, top]
    const p1 = [tx + cos * len * 0.5, top + sin * len * 0.6 - len * 0.1 * (1 - up)]
    const p2 = [tx + cos * len * (0.95 - 0.25 * up), top + sin * len * (0.55 + 0.25 * up) + len * 0.62 * Math.pow(1 - up, 1.4)]
    let ink = `<path d="M${p0[0]} ${p0[1]} Q ${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]}" fill="none" stroke-width="${crown * 0.013}" stroke-linecap="round"/>`
    let lit = ''
    const steps = 24
    for (let s = 2; s < steps; s++) {
      const t = s / steps
      const px = (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0]
      const py = (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]
      let dx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0])
      let dy = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1])
      const d = Math.hypot(dx, dy) || 1
      dx /= d
      dy /= d
      // Upright fronds carry shorter leaflets, so the crown's top doesn't read as thatch.
      const length = crown * (0.27 * Math.pow(Math.sin(Math.PI * t), 0.8) + 0.02) * c.between(0.8, 1.12) * (1 - 0.4 * up)
      for (const s2 of [1, -1]) {
        const nx = -dy * s2
        const ny = dx * s2
        // Forward along the spine, out to the side, and down under its own
        // weight, more towards the tip; each leaflet a little off true.
        const jitter = c.between(-0.2, 0.2)
        let ex = dx * 0.42 + nx * 0.9 + jitter * ny
        let ey = dy * 0.42 + ny * 0.9 - jitter * nx + 0.5 + 0.45 * t
        const e = Math.hypot(ex, ey) || 1
        ex = px + (ex / e) * length
        ey = py + (ey / e) * length
        const wv = crown * 0.0065
        const blade = `<path d="M${px - (ey - py) * (wv / length)} ${py + (ex - px) * (wv / length)} L ${ex} ${ey} L ${px + (ey - py) * (wv / length)} ${py - (ex - px) * (wv / length)} Z"/>`
        // The side whose normal points up is the lit one.
        if (!behind && ny < 0 && c.chance(0.6)) lit += blade
        else ink += blade
      }
    }
    if (behind) back += ink
    else {
      fronds += ink
      leaflets += lit
    }
  }
  // The knot of the crown and a few coconuts tucked under it.
  let knot = `<ellipse cx="${tx}" cy="${top + crown * 0.02}" rx="${crown * 0.07}" ry="${crown * 0.06}"/>`
  for (let i = 0; i < 4; i++) knot += `<circle cx="${tx + c.between(-0.06, 0.06) * crown}" cy="${top + c.between(0.04, 0.09) * crown}" r="${crown * 0.035}"/>`
  return { trunk, rings, back, fronds: fronds + knot, leaflets }
}

/** Short horizontal glints on water, in rows that tighten and shrink towards the horizon. */
export function glints(c: Canvas, { top, bottom, x0 = 0, x1 = c.W, colour = '#ffffff', per = 0.0011, size = 1, alpha = 0.9 }: { top: number; bottom: number; x0?: number; x1?: number; colour?: string; per?: number; size?: number; alpha?: number }) {
  const list: Rect[] = []
  const n = Math.round((x1 - x0) * (bottom - top) * per)
  for (let i = 0; i < n; i++) {
    const y = top + Math.pow(c.random(), 0.8) * (bottom - top)
    const depth = (y - top) / Math.max(1, bottom - top)
    const w = (2 + depth * 14) * size * c.between(0.4, 1.4)
    const h = Math.max(1, (0.8 + depth * 2.4) * size)
    list.push({ x: x0 + c.random() * (x1 - x0), y, w, h, colour, alpha: alpha * c.between(0.45, 1) })
  }
  return list
}

/**
 * A round glow as SVG markup for Canvas.svg: a radial gradient that falls
 * off smoothly to nothing, so a big halo (a low sun, a moon, a lamp) has no
 * edge, which a blurred disc keeps.
 */
let haloCount = 0

export function halo(cx: number, cy: number, r: number, colour: string, alpha = 1) {
  // Numbered, so two halos in one svg() never share a gradient.
  const id = `halo-${haloCount++}`
  const falloff: Array<[number, number]> = [
    [0, 1],
    [0.15, 0.78],
    [0.35, 0.45],
    [0.6, 0.18],
    [0.8, 0.05],
    [1, 0],
  ]
  const list = falloff.map(([o, a]) => `<stop offset="${o}" stop-color="${colour}" stop-opacity="${a * alpha}"/>`).join('')
  return `<defs><radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}" gradientUnits="userSpaceOnUse">${list}</radialGradient></defs><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id})"/>`
}
