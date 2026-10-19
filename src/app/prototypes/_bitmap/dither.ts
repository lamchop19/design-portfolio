import type { Discipline } from '@/lib/disciplines'

/*
 * Bitmap specimens: soft organic shapes printed as an ordered dither in a few
 * inks on paper, after the "Bitmap Dreams" look. Pure functions on typed
 * arrays, no DOM, so the live canvas and the build script (scripts/
 * generate-bitmaps.tsx) draw exactly the same pixels.
 *
 * The look comes from one idea: each composition is a single scalar field,
 * high in the shapes' cores and falling to zero at their edges. The field is
 * cut into bands, one ink per band (charcoal core, then two colours, then a
 * yellow edge), and each step from one band to the next is dithered with a
 * Bayer matrix, so the inks ring every shape and fray into each other. One
 * ink is printed again a few pixels off register, as a halo.
 */

export type Rgb = readonly [number, number, number]

export type PaletteId = 'dreams' | 'discipline' | 'negative'

export const PALETTES: Array<{ id: PaletteId; name: string; note: string }> = [
  { id: 'dreams', name: 'Bitmap dreams', note: 'The reference: charcoal, sage, sky and butter on warm paper, a pink halo.' },
  { id: 'discipline', name: 'By discipline', note: 'Each project in the softened inks of its own disciplines: Brand blue, Social pink, Content green.' },
  { id: 'negative', name: 'Negative', note: 'Printed straight onto the dark page: paper-white cores, inks fading out to the ground.' },
]

/** Screen pixels per bitmap pixel. */
export const PIXEL_SIZES = [2, 3, 4, 6] as const
export type PixelSize = (typeof PIXEL_SIZES)[number]

/** The size the build script prints at, in CSS px; the cover cell is 4:5 on desktop. */
export const PRINT_SIZE = { width: 480, height: 600 } as const

export type Inks = {
  /** null leaves the ground transparent, for the page to show through. */
  paper: Rgb | null
  /** Specks in the paper; null for none. */
  grain: Rgb | null
  /** Edge to core. */
  bands: readonly [Rgb, Rgb, Rgb, Rgb]
  /** The off-register pass. */
  halo: Rgb
}

const hex = (value: string): Rgb => {
  const n = Number.parseInt(value.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const PAPER = hex('#ecebe5')
const GRAIN = hex('#cfccc2')
const CHARCOAL = hex('#2e2f31')
const BUTTER = hex('#f0dc55')

/** The discipline inks, softened towards the reference's chalky tones. */
const SOFT: Record<Discipline, Rgb> = {
  Brand: hex('#7fa3f2'),
  Social: hex('#f0a3c8'),
  Content: hex('#a3d9a9'),
}

const DISCIPLINE_ORDER: Discipline[] = ['Brand', 'Social', 'Content']

export function inksFor(palette: PaletteId, disciplines: readonly Discipline[]): Inks {
  switch (palette) {
    case 'dreams':
      return {
        paper: PAPER,
        grain: GRAIN,
        bands: [BUTTER, hex('#86b8e3'), hex('#9fd4a8'), CHARCOAL],
        halo: hex('#e9a3b8'),
      }
    case 'discipline': {
      // The project's own disciplines first, then the others to fill the bands.
      const order = [...disciplines, ...DISCIPLINE_ORDER.filter((d) => !disciplines.includes(d))]
      return { paper: PAPER, grain: GRAIN, bands: [BUTTER, SOFT[order[1]], SOFT[order[0]], CHARCOAL], halo: SOFT[order[2]] }
    }
    case 'negative':
      return {
        paper: null,
        grain: null,
        bands: [hex('#3d5a86'), hex('#86b8e3'), hex('#9fd4a8'), PAPER],
        halo: BUTTER,
      }
  }
}

/* ---- Randomness, seeded by the project so its specimen never changes ---- */

function hashString(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A cheap, smooth 2D value noise, roughly -1 to 1. */
function makeNoise(random: () => number) {
  const size = 64
  const grid = Float32Array.from({ length: size * size }, () => random() * 2 - 1)
  const at = (x: number, y: number) => grid[(((y % size) + size) % size) * size + (((x % size) + size) % size)]
  const fade = (t: number) => t * t * (3 - 2 * t)
  return (x: number, y: number) => {
    const x0 = Math.floor(x)
    const y0 = Math.floor(y)
    const fx = fade(x - x0)
    const fy = fade(y - y0)
    const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * fx
    const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * fx
    return top + (bottom - top) * fy
  }
}

/* ---- The composition ---- */

type Shape =
  | { kind: 'blob'; x: number; y: number; r: number; lobes: number; amp: number; turn: number; weight: number }
  | { kind: 'ring'; x: number; y: number; r: number; width: number; weight: number }
  | { kind: 'hole'; x: number; y: number; r: number }

/** A specimen's shapes, in units of the shorter side, centred on 0. */
function compose(random: () => number): Shape[] {
  const between = (lo: number, hi: number) => lo + random() * (hi - lo)
  const spot = (reach: number) => {
    const angle = random() * Math.PI * 2
    const distance = Math.sqrt(random()) * reach
    return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance }
  }

  const shapes: Shape[] = [
    // The ground: one big, low mass the others sit in, mostly the outer inks.
    { kind: 'blob', x: 0, y: 0, r: between(0.36, 0.42), lobes: 3, amp: 0.12, turn: random() * 6, weight: 0.42 },
    // A spiky star or flower, the specimen's figure.
    { kind: 'blob', ...spot(0.18), r: between(0.13, 0.18), lobes: 5 + Math.floor(random() * 5), amp: between(0.3, 0.45), turn: random() * 6, weight: 1 },
  ]
  for (let i = 0, n = 2 + Math.floor(random() * 2); i < n; i++) {
    shapes.push({ kind: 'blob', ...spot(0.26), r: between(0.07, 0.13), lobes: 2 + Math.floor(random() * 3), amp: between(0.08, 0.2), turn: random() * 6, weight: between(0.45, 0.9) })
  }
  shapes.push({ kind: 'ring', ...spot(0.24), r: between(0.06, 0.1), width: between(0.03, 0.05), weight: 0.7 })
  for (let i = 0, n = 2 + Math.floor(random() * 3); i < n; i++) {
    shapes.push({ kind: 'hole', ...spot(0.34), r: between(0.025, 0.05) })
  }
  return shapes
}

/**
 * The scalar field for a `width` × `height` bitmap: 0 on bare paper, rising
 * to about 1 in the shapes' cores. Seeded by `seed`, and laid out in units of
 * the shorter side, so a specimen keeps its composition at any size.
 */
export function buildField(seed: string, width: number, height: number) {
  const random = mulberry32(hashString(seed))
  const noise = makeNoise(random)
  const shapes = compose(random)
  const unit = Math.min(width, height)
  const field = new Float32Array(width * height)

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      let x = (px + 0.5 - width / 2) / unit
      let y = (py + 0.5 - height / 2) / unit
      // A slow warp, so no edge is a clean curve.
      x += noise(x * 7 + 11, y * 7) * 0.025
      y += noise(x * 7, y * 7 + 23) * 0.025

      // Shapes add up like inks laid over each other (1 − Π(1 − v)), so each
      // keeps its own rings even where it sits on the ground.
      let clear = 1
      let cut = 0
      for (const shape of shapes) {
        const dx = x - shape.x
        const dy = y - shape.y
        const distance = Math.hypot(dx, dy)
        if (shape.kind === 'hole') {
          cut = Math.max(cut, 1 - distance / shape.r)
        } else if (shape.kind === 'ring') {
          clear *= 1 - shape.weight * Math.max(0, 1 - Math.abs(distance - shape.r) / shape.width)
        } else {
          const angle = Math.atan2(dy, dx)
          const edge = shape.r * (1 + shape.amp * Math.sin(shape.lobes * angle + shape.turn) + noise(angle * 2 + shape.turn * 5, shape.r * 40) * 0.08)
          clear *= 1 - shape.weight * Math.max(0, 1 - distance / edge)
        }
      }
      // A fine mottle inside the shapes, so the bands print grainy rather than
      // as flat fills; bare paper stays clean.
      const base = 1 - clear
      const value = base + (noise(px * 0.9, py * 0.9) * 0.045 + noise(x * 22, y * 22) * 0.05) * Math.min(1, base * 5)
      // Holes punch clean paper through the ground.
      field[py * width + px] = Math.max(0, value * (1 - Math.min(1, Math.max(0, cut) * 2.2)))
    }
  }
  return field
}

/* ---- Printing ---- */

/** 8 × 8 Bayer thresholds, 0–1. */
const BAYER = (() => {
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

/** Where each ink starts, edge to core. */
const THRESHOLDS = [0.04, 0.2, 0.42, 0.72] as const
/** How much of each step is dithered: 1 blends a whole band, lower keeps bands distinct. */
const SPREAD = 0.7
/** The halo's offset, in bitmap pixels. */
const HALO = { x: 2, y: 1 }

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n)

/** A hash per pixel for the paper's grain. */
const speck = (x: number, y: number) => {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/**
 * Prints `field` into `out` (RGBA, `width` × `height`). `progress`, 0–1,
 * grows the shapes out from their cores, so a sweep from 0 to 1 dissolves the
 * specimen in through the dither.
 */
export function print(out: Uint8ClampedArray, field: Float32Array, width: number, height: number, inks: Inks, progress = 1) {
  // Early in the sweep only the cores clear the thresholds.
  const lift = (1 - progress) * 0.75
  const scale = 0.4 + progress * 0.6

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      const v = (field[i] - lift) / scale
      const bayer = BAYER[(y & 7) * 8 + (x & 7)]
      let ink: Rgb | null = null

      if (v >= THRESHOLDS[0]) {
        // The band this pixel is in, and how far through the step to the next.
        let band = 0
        while (band < THRESHOLDS.length - 1 && v >= THRESHOLDS[band + 1]) band++
        const next = THRESHOLDS[band + 1] ?? THRESHOLDS[band] + 0.2
        const through = clamp01(((v - THRESHOLDS[band]) / (next - THRESHOLDS[band]) - 0.5) / SPREAD + 0.5)
        // Below the halfway mark of a step the outer ink holds; past it the inner one wins, dithered.
        ink = band < 3 && through > bayer ? inks.bands[band + 1] : inks.bands[band]
        if (band === 0 && v < THRESHOLDS[0] + 0.05 && bayer > (v - THRESHOLDS[0]) / 0.05) ink = null
      }

      if (!ink) {
        // Off register: the halo ink shows where the shifted print falls on bare paper.
        const hx = x - HALO.x
        const hy = y - HALO.y
        if (hx >= 0 && hy >= 0 && hx < width && hy < height) {
          const shifted = (field[hy * width + hx] - lift) / scale
          if (shifted >= THRESHOLDS[0] * 0.6 && bayer < clamp01((shifted - THRESHOLDS[0] * 0.6) / 0.08) * 0.7) ink = inks.halo
        }
      }

      if (!ink) ink = inks.grain && speck(x, y) < 0.035 ? inks.grain : inks.paper

      const o = i * 4
      if (ink) {
        out[o] = ink[0]
        out[o + 1] = ink[1]
        out[o + 2] = ink[2]
        out[o + 3] = 255
      } else {
        out[o + 3] = 0
      }
    }
  }
}

/** The pre-rendered file for one specimen, under public/. */
export function printPath(slug: string, palette: PaletteId, pixel: PixelSize) {
  return `/bitmap/${slug}-${palette}-${pixel}.png`
}
