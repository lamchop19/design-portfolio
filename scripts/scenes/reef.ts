import type { Painter } from '.'
import { drawFish, FISH_BOX } from '../../src/lib/fish'
import { airbrush, over, softAlpha } from '../airbrush'
import { Canvas, type Dot, halo, mix, rgbOf, stops, type Twinkle } from './kit'

/**
 * Reef, after the aquarium and the Saville-Kent plates: a reef seen from the
 * sand, as a landscape rather than a tank. Under a rippling surface the water
 * runs from bright cyan to blue and shafts of sun fan down through it. Coral
 * heads stand in rows that fade into the blue with distance, a lit bommie
 * rises a little right of centre, and big heads crop in at the edges in
 * front: a brain coral under a pink sea fan on the left, shelves of plate
 * coral off a lilac head on the right, staghorn in coral and the brand blue,
 * all on sand netted with caustics. A pink school and a silver one curl high
 * on either side, a blue tang keeps to the reef, and a parrotfish drifts on
 * its own layer. Open water above the bommie is left for type.
 */

/** The water at the horizon: what everything fades towards with distance. */
export const HAZE = '#2b80cc'

/** Shadow under water is navy, never black. */
const SHADOW = '#172a6e'

/** Towards the sun, high and a little right: the side every coral is lit from. */
const LIGHT = { x: 0.5, y: -0.87 }

/** Coral colours: the brand inks (pink, green, blue) and three to set them off. */
const PINK = '#f551ab'
const GREEN = '#81db89'
const BLUE = '#0059ff'
const CORAL = '#ff8a4c'
const LILAC = '#a58bff'
const GOLD = '#ffcf5a'
const KINDS = [PINK, GREEN, CORAL, LILAC, GOLD, PINK, GREEN]

export const reef: Painter = async (c) => {
  const { W, H } = c
  const line = H * 0.6 // the far edge of the sand: the horizon

  // Water: pale under the surface, bright cyan, deepening to blue at the horizon.
  await c.svg(`<defs><linearGradient id="water" x1="0" y1="0" x2="0" y2="1">${stops([
    [0, '#c9f6fb'],
    [0.045, '#7fe1f3'],
    [0.16, '#3fc3ec'],
    [0.38, '#2aa0e0'],
    [0.6, HAZE],
    [1, HAZE],
  ])}</linearGradient></defs><rect width="${W}" height="${H}" fill="url(#water)"/>`)
  c.stipple({ x: 0, y: 0, w: W, h: line }, { per: 0.005, dark: '#0f5aa8', light: '#e8fbff', darkAlpha: 0.26, lightAlpha: 0.22, r: [0.6, 1.3] })

  // The surface seen from below: a bright skin crossed by rippling lines of light.
  let ripples = ''
  for (let k = 0; k < 9; k++) {
    const y0 = H * (0.006 + k * k * 0.0011)
    const amp = H * (0.002 + k * 0.0007)
    const f = c.between(0.006, 0.011)
    const phase = c.between(0, 9)
    let d = `M-20 ${y0}`
    for (let x = 0; x <= W + 40; x += 30) d += ` L${x} ${(y0 + Math.sin(x * f + phase) * amp + Math.sin(x * f * 2.7 + phase) * amp * 0.4).toFixed(1)}`
    ripples += `<path d="${d}" fill="none" stroke-width="${Math.max(1.2, 4 - k * 0.35)}"/>`
  }
  await c.shape(ripples, '#ffffff', { blur: 1.4, opacity: 0.55 })
  const glints = c.scatter(900, (_, y) => Math.max(0, 1 - y / (H * 0.07)), () => ({ r: c.between(0.8, 2.2), colour: c.pick(['#ffffff', '#f2feff']), alpha: c.between(0.5, 1) }), { x: 0, y: 0, w: W, h: H * 0.07 })
  c.dots(glints)

  // Shafts of sun, fanning down from the surface. The first falls on the bommie, so it reads as lit.
  const shafts = Array.from({ length: 9 }, (_, i) => {
    const x = i === 0 ? W * 0.53 : c.between(-0.05, 1.05) * W
    return {
      x,
      spread: i === 0 ? W * 0.05 : c.between(0.018, 0.06) * W,
      lean: i === 0 ? W * 0.02 : (x / W - 0.5) * W * 0.22 + c.between(-0.05, 0.05) * W,
      reach: i === 0 ? H * 0.72 : H * c.between(0.5, 0.85),
      opacity: i === 0 ? 0.26 : c.between(0.12, 0.22),
    }
  })

  // Marine snow: specks drifting in the open water.
  const snow = c.scatter(1500, () => 1, () => ({ r: c.between(0.6, 1.5), colour: c.pick(['#ffffff', '#dff7ff']), alpha: c.between(0.2, 0.65) }), { x: 0, y: H * 0.06, w: W, h: line - H * 0.06 })
  c.dots(snow)

  // The sand floor: blue with distance at the horizon, warm and pale in front.
  await c.svg(`<defs><linearGradient id="sand" x1="0" y1="${line}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse">${stops([
    [0, '#4f9ed4'],
    [0.14, '#82bcd6'],
    [0.4, '#c3d4c6'],
    [0.7, '#e6d7b4'],
    [1, '#f2e1bb'],
  ])}</linearGradient></defs><rect y="${line}" width="${W}" height="${H - line}" fill="url(#sand)"/>`, { blur: 1.5 })
  // Ripples in the sand, tighter towards the horizon: a shadow line with a lit crest above it.
  let shadowLines = ''
  let crestLines = ''
  for (let y = line + 6, k = 0; y < H + 20; k++) {
    const depth = (y - line) / (H - line)
    const amp = 2 + depth * 9
    const f = 0.004 + c.between(0, 0.003)
    const phase = c.between(0, 9)
    const pts: string[] = []
    for (let x = -20; x <= W + 40; x += 24) pts.push(`${x},${(y + Math.sin(x * f + phase) * amp + Math.sin(x * f * 3.1 + phase) * amp * 0.3).toFixed(1)}`)
    const width = 0.8 + depth * 3.2
    shadowLines += `<polyline points="${pts.join(' ')}" fill="none" stroke-width="${width}"/>`
    crestLines += `<polyline points="${pts.map((p) => p.replace(/,([\d.-]+)$/, (_, v) => `,${(Number(v) - width * 1.4).toFixed(1)}`)).join(' ')}" fill="none" stroke-width="${width * 0.8}"/>`
    y += 5 + depth * depth * 46 + k * 0.2
  }
  await c.shape(shadowLines, '#a99475', { blur: 1.4, opacity: 0.36 })
  await c.shape(crestLines, '#fff6de', { blur: 1.2, opacity: 0.45 })
  c.stipple({ x: 0, y: line, w: W, h: H - line }, { per: 0.012, dark: '#8a7558', light: '#ffffff', darkAlpha: 0.32, lightAlpha: 0.26, r: [0.6, 1.6] })
  // Caustics: the surface's net of light thrown on the sand, coarse in front, lost by the horizon.
  const sparkle = net(c, { top: line, bottom: H, near: H, vanish: line - H * 0.05, cell: 230, width: 0.09, colour: '#fffdf0', strength: 0.4, seed: 3, fade: (y) => 0.35 + 0.65 * ((y - line) / (H - line)) })
  // Pools of light on the sand where the longest shafts come down.
  const pool = H * 0.7
  for (const s of shafts.filter((s) => s.reach > pool * 1.05)) {
    const px = s.x + s.lean * (pool / s.reach)
    await c.svg(`<g transform="translate(${px} ${pool}) scale(1 0.28) translate(${-px} ${-pool})">${halo(px, pool, s.spread * 2.4, '#fffbe6', s.opacity * 2.2 * (1 - pool / s.reach))}</g>`)
  }
  // Where the sand meets the water, a soft haze.
  await c.soft(`<rect x="-50" y="${line - H * 0.025}" width="${W + 100}" height="${H * 0.05}"/>`, HAZE, 14, 0.5)

  // The far reef: a row of small heads along the horizon, almost lost in the blue.
  await row(c, { from: -40, to: W + 40, foot: line + 2, gap: [26, 70], size: H * 0.05, depth: 0.9 })
  // A nearer row, in clumps either side of the channel.
  await row(c, { from: -30, to: W * 0.4, foot: line + H * 0.035, gap: [40, 110], size: H * 0.085, depth: 0.74 })
  await row(c, { from: W * 0.7, to: W + 30, foot: line + H * 0.035, gap: [40, 110], size: H * 0.085, depth: 0.74 })

  // The shafts, over the far reef, fading as they go down.
  for (const { x, spread, lean, reach, opacity } of shafts) {
    const d = `M${x - spread * 0.25} 0 L${x + spread * 0.25} 0 L${x + lean + spread} ${reach} L${x + lean - spread} ${reach} Z`
    const shaft = await c.softMask(`<path d="${d}"/>`, W * 0.012)
    for (let y = 0; y < H; y++) {
      const fade = Math.max(0, 1 - y / reach)
      for (let x2 = 0, o = y * W; x2 < W; x2++, o++) shaft[o] *= fade
    }
    c.paintMask(shaft, '#ffffff', opacity)
  }

  // Mid-distance: low heads either side of the bommie, half lost in the blue.
  await contact(c, [
    [W * 0.17, H * 0.71, W * 0.14],
    [W * 0.85, H * 0.705, W * 0.12],
  ], 0.5)
  await brain(c, { x: W * 0.12, foot: H * 0.715, rx: W * 0.06, ry: H * 0.08, colour: GREEN, depth: 0.55 })
  await plates(c, { x: W * 0.17, foot: H * 0.705, w: W * 0.075, h: H * 0.08, colour: LILAC, depth: 0.53, tiers: 3, root: -1, eye: line })
  await staghorn(c, { x: W * 0.235, foot: H * 0.72, h: H * 0.14, colour: CORAL, depth: 0.52 })
  await seaFan(c, { x: W * 0.83, foot: H * 0.71, w: W * 0.09, h: H * 0.2, colour: LILAC, depth: 0.55 })
  await brain(c, { x: W * 0.9, foot: H * 0.712, rx: W * 0.055, ry: H * 0.07, colour: GOLD, depth: 0.52 })
  await staghorn(c, { x: W * 0.78, foot: H * 0.715, h: H * 0.12, colour: PINK, depth: 0.52 })

  // The bommie: a mound of coral heads a little right of centre, in the light.
  const bx = W * 0.55
  const bf = H * 0.735
  await contact(c, [[bx, bf, W * 0.21]], 0.4)
  await seaFan(c, { x: bx - W * 0.035, foot: bf - H * 0.17, w: W * 0.1, h: H * 0.2, colour: PINK, depth: 0.36 })
  const mound = [
    await brain(c, { x: bx - W * 0.07, foot: bf, rx: W * 0.075, ry: H * 0.13, colour: LILAC, depth: 0.34 }),
    await brain(c, { x: bx, foot: bf + 4, rx: W * 0.085, ry: H * 0.165, colour: GREEN, depth: 0.32 }),
    await brain(c, { x: bx + W * 0.075, foot: bf + 8, rx: W * 0.062, ry: H * 0.1, colour: GOLD, depth: 0.3 }),
  ]
  await plates(c, { x: bx + W * 0.115, foot: bf - H * 0.005, w: W * 0.12, h: H * 0.11, colour: CORAL, depth: 0.3, tiers: 4, root: -1, eye: line })
  await staghorn(c, { x: bx - W * 0.03, foot: bf - H * 0.15, h: H * 0.14, colour: PINK, depth: 0.32 })
  await brain(c, { x: bx - W * 0.115, foot: bf + 8, rx: W * 0.04, ry: H * 0.05, colour: CORAL, depth: 0.3 })
  // Sunlight washing its crown, where the shaft lands.
  const crown = await patch(mound.map((m) => m.outline).join(''), { x: bx - W * 0.16, y: bf - H * 0.18, w: W * 0.32, h: H * 0.2 }, 3)
  fadePatch(crown, (x, y) => (1 - (y - (bf - H * 0.17)) / (H * 0.1)) * (1 - Math.abs(x - bx - W * 0.01) / (W * 0.13)))
  lay(c, crown, flat('#f2fdff'), () => 0, 0.4)

  // Fish: the pink school high on the left, the silver one on the right.
  const tetra = await Promise.all(
    [0, 1, 2].map((i) => {
      const w = Math.round(H * (0.034 + i * 0.006))
      const drawing = drawFish('tetra', `school-${i}`)
      return airbrush(drawing.layers, drawing.colours, { width: w, height: Math.round((w * FISH_BOX.height) / FISH_BOX.width) }, FISH_BOX, { scale: (w / 210) * 0.7 })
    }),
  )
  for (let i = 0; i < 90; i++) {
    const t = c.random()
    const [px, py, nx, ny] = curve([-W * 0.02, H * 0.36], [W * 0.13, H * 0.12], [W * 0.3, H * 0.22], t)
    const off = gauss(c) * H * (0.015 + 0.035 * Math.sin(Math.PI * t))
    const image = c.pick(tetra)
    over(c.img, image, px + nx * off - image.size.width / 2, py + ny * off - image.size.height / 2, 0.95)
  }
  const silver = await school(c, { from: [W * 1.02, H * 0.44], via: [W * 0.86, H * 0.06], to: [W * 0.68, H * 0.2], count: 240, len: [20, 32], thick: H * 0.06 })
  // A blue tang by the reef on the left.
  await bigFish(c, 'tang', { x: W * 0.26, y: H * 0.5, len: H * 0.18, right: true, haze: 0.1 })

  // In front, cropping in at the edges: on the left a pink sea fan and
  // staghorn behind a huge brain coral; on the right a gold fan behind a
  // lilac head with shelves of plate coral growing off it, and staghorn in
  // the brand blue.
  await seaFan(c, { x: W * 0.12, foot: H * 0.86, w: W * 0.22, h: H * 0.52, colour: PINK, depth: 0.1 })
  await staghorn(c, { x: W * 0.255, foot: H * 1.02, h: H * 0.36, colour: CORAL, depth: 0.06, spread: 0.85 })
  await brain(c, { x: W * 0.035, foot: H * 1.06, rx: W * 0.19, ry: H * 0.34, colour: GREEN, depth: 0 })
  await seaFan(c, { x: W * 0.86, foot: H * 0.8, w: W * 0.16, h: H * 0.42, colour: GOLD, depth: 0.12 })
  await brain(c, { x: W * 1.0, foot: H * 1.08, rx: W * 0.15, ry: H * 0.42, colour: LILAC, depth: 0.02 })
  await plates(c, { x: W * 0.9, foot: H * 1.0, w: W * 0.2, h: H * 0.3, colour: CORAL, depth: 0, tiers: 6, root: 1, eye: line })
  await staghorn(c, { x: W * 0.69, foot: H * 1.03, h: H * 0.28, colour: BLUE, depth: 0, spread: 1.35 })

  // Bubbles rising off the reef on the right, below the silver school: rings with a bright catch-light.
  let bubbles = ''
  const bubbleDots: Dot[] = []
  for (let i = 0; i < 16; i++) {
    const t = c.random()
    const x = W * 0.965 + Math.sin(t * 7) * W * 0.008 + c.between(-10, 10)
    const y = H * 0.64 - t * H * 0.2
    const r = H * (0.004 + t * 0.006) * c.between(0.7, 1.2)
    bubbles += `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke-width="${Math.max(1.4, r * 0.2)}"/>`
    bubbleDots.push({ x: x - r * 0.35, y: y - r * 0.35, r: r * 0.24, colour: '#ffffff', alpha: 0.95 })
  }
  await c.shape(bubbles, '#ffffff', { blur: 1.1, opacity: 0.75 })
  c.dots(bubbleDots)

  // The parrotfish: its own layer, drifting over the open water right of centre.
  const fish = new Canvas({ width: 460, height: 330 }, 'reef-parrotfish')
  await bigFish(fish, 'parrot', { x: 230, y: 165, len: 420, right: false, haze: 0.06 })

  // What twinkles: the silver school's glints, glints at the surface and on
  // the sand, the bubbles' catch-lights, a little snow.
  const twinkles: Twinkle[] = [...silver, ...glints.filter(() => c.chance(0.1)), ...sparkle.filter(() => c.chance(0.5)), ...bubbleDots, ...snow.filter(() => c.chance(0.03))].map((d) => [d.x / W, d.y / H, Math.min(3, Math.max(1, d.r)) / W, d.colour])
  return {
    motion: { twinkles, sprites: [{ file: 'fish', x: (W * 0.69 - 230) / W, y: (H * 0.42 - 165) / H, w: 460 / W, motion: 'drift', speed: 1 }] },
    layers: { fish },
    noise: 15,
  }
}

/* ---- Painting in patches ---- */

type RGB = readonly [number, number, number]

/** Lit, body and shadow colours of one ink, for shading along. */
export type Ramp = readonly [lit: RGB, body: RGB, dark: RGB]

/** One ink at a distance: its ramp, and the same three colours as hex for dots. */
export type Tone = { lit: string; body: string; dark: string; ramp: Ramp }

/** An ink's lit side, body and shadow, faded towards the water by `haze` (0 near, 1 lost in the blue). */
export function tone(colour: string, haze = 0, water = HAZE): Tone {
  const lit = mix(mix(colour, '#ffffff', 0.5), water, haze)
  const body = mix(colour, water, haze)
  const dark = mix(mix(colour, SHADOW, 0.5), water, haze)
  return { lit, body, dark, ramp: [rgbOf(lit), rgbOf(body), rgbOf(dark)] }
}

/** How distance reads under water: faded into the blue, softer at the edge, finer in texture. */
export function look(depth: number) {
  return { haze: Math.min(0.9, 0.95 * depth ** 1.1), blur: 1.1 + depth * 2.6, fine: 1 - depth * 0.6 }
}

/** Shapes rasterized just around themselves (one coral, one fish), not over the whole canvas. */
export type Patch = { x: number; y: number; w: number; h: number; alpha: Float32Array }

/** Rasterizes shapes, in canvas coordinates, inside `box`, blurred by `blur` px. */
export async function patch(inner: string, box: { x: number; y: number; w: number; h: number }, blur = 0): Promise<Patch> {
  const pad = Math.ceil(blur * 3) + 2
  const x = Math.floor(box.x) - pad
  const y = Math.floor(box.y) - pad
  const w = Math.ceil(box.w) + pad * 2
  const h = Math.ceil(box.h) + pad * 2
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}"><g fill="#000" stroke="#000">${inner}</g></svg>`
  return { x, y, w, h, alpha: await softAlpha(svg, { width: w, height: h }, blur) }
}

/** A patch's alpha at a canvas point, 0 outside it. */
export function alphaAt(p: Patch, x: number, y: number) {
  const i = Math.floor(x) - p.x
  const j = Math.floor(y) - p.y
  return i < 0 || j < 0 || i >= p.w || j >= p.h ? 0 : p.alpha[j * p.w + i]
}

/**
 * Lays a patch over the canvas shaded along a ramp: `t(x, y)` runs from 0,
 * the lit colour, through 0.5, the body, to 1, the shadow. Works on a
 * transparent layer as well as on the scene.
 */
export function lay(c: Canvas, p: Patch, ramp: Ramp, t: (x: number, y: number) => number, opacity = 1) {
  const { data } = c.img
  const [l, m, d] = ramp
  for (let j = 0; j < p.h; j++) {
    const y = p.y + j
    if (y < 0 || y >= c.H) continue
    for (let i = 0; i < p.w; i++) {
      const x = p.x + i
      if (x < 0 || x >= c.W) continue
      const a = p.alpha[j * p.w + i] * opacity
      if (a <= 0.002) continue
      const s = Math.min(2, Math.max(0, t(x, y) * 2))
      const k = s < 1 ? s : s - 1
      const from = s < 1 ? l : m
      const to = s < 1 ? m : d
      const o = (y * c.W + x) * 4
      const below = data[o + 3]
      const total = a + below * (1 - a)
      for (let ch = 0; ch < 3; ch++) data[o + ch] = ((from[ch] + (to[ch] - from[ch]) * k) * a + data[o + ch] * below * (1 - a)) / total
      data[o + 3] = total
    }
  }
}

/** Scales a patch's alpha by `f(x, y)` (clamped to 0–1), in place: a mask that fades out. */
export function fadePatch(p: Patch, f: (x: number, y: number) => number) {
  for (let j = 0; j < p.h; j++) {
    for (let i = 0; i < p.w; i++) p.alpha[j * p.w + i] *= Math.min(1, Math.max(0, f(p.x + i, p.y + j)))
  }
  return p
}

/** One colour as a ramp, for patches that aren't shaded. */
export const flat = (hex: string): Ramp => [rgbOf(hex), rgbOf(hex), rgbOf(hex)]

/**
 * Overspray: fine dots of a shape's own colours just outside its edge,
 * thinning out within `reach` px, so a silhouette reads as sprayed rather
 * than cut (as Breaker's foam). `inner` is the shape `p` was made from.
 */
export async function overspray(c: Canvas, inner: string, p: Patch, colours: string[], { reach = 5, count = 400, size = 1 } = {}) {
  const spray = await patch(inner, { x: p.x, y: p.y, w: p.w, h: p.h }, reach)
  c.dots(
    c.scatter(count, (x, y) => Math.min(1, alphaAt(spray, x, y) * 1.8) * (1 - alphaAt(p, x, y)) ** 2, () => ({ r: c.between(0.5, 1.2) * size, colour: c.pick(colours), alpha: c.between(0.3, 0.85) }), { x: spray.x, y: spray.y, w: spray.w, h: spray.h }),
  )
}

/**
 * A glow that follows a shape's outline, in its own colour, for corals that
 * light the water at night (round glows are the kit's `halo`).
 */
export async function aura(c: Canvas, inner: string, box: { x: number; y: number; w: number; h: number }, colour: string, opacity: number, radius: number) {
  lay(c, await patch(inner, box, radius), flat(colour), () => 0, opacity)
}

/** A field of polyps over a patch: small dots, some lit, some in shadow. */
export function polyps(c: Canvas, p: Patch, ink: Tone, count: number, size = 1) {
  c.dots(
    c.scatter(count, (x, y) => alphaAt(p, x, y) ** 3, () => {
      const lit = c.chance(0.5)
      return { r: c.between(0.6, 1.5) * size, colour: lit ? ink.lit : ink.dark, alpha: c.between(0.2, 0.5) }
    }, { x: p.x, y: p.y, w: p.w, h: p.h }),
  )
}

/** Soft shadows on the sand under things standing on it: [x, foot, width] each. */
async function contact(c: Canvas, feet: Array<[number, number, number]>, opacity: number) {
  await c.soft(feet.map(([x, y, w]) => `<ellipse cx="${x}" cy="${y}" rx="${w / 2}" ry="${w * 0.06}"/>`).join(''), SHADOW, 10, opacity)
}

/* ---- The corals ---- */

/** What a coral painter hands back: its outline as SVG, and the patches it was laid with (for glints, or light). */
export type Coral = { outline: string; patches: Patch[] }

/**
 * Brain coral: a lumpy dome on (x, foot), lit from the upper right and dark
 * underneath. Its ridges meander over it like a fingerprint, worked out on
 * the dome's own curved surface so they crowd towards the edges, and are
 * stippled in: dark in the grooves, pale on the crests. Polyps speckle all
 * of it and its edge is sprayed.
 */
export async function brain(c: Canvas, { x, foot, rx, ry, colour, depth, water = HAZE, glow = 0 }: { x: number; foot: number; rx: number; ry: number; colour: string; depth: number; water?: string; glow?: number }): Promise<Coral> {
  const { haze, blur, fine } = look(depth)
  const ink = tone(colour, haze, water)
  const lump = c.between(0, 6)
  const pts: string[] = []
  for (let i = 0; i <= 60; i++) {
    const th = Math.PI * (1 - i / 60)
    const k = 1 + 0.035 * Math.sin(th * 5 + lump) + 0.018 * Math.sin(th * 13 + lump * 2)
    const cx = Math.cos(th)
    pts.push(`${(x + Math.sign(cx) * Math.abs(cx) ** 0.85 * rx * k).toFixed(1)},${(foot - Math.sin(th) ** 0.7 * ry * k).toFixed(1)}`)
  }
  pts.push(`${x + rx},${foot + ry * 0.1}`, `${x - rx},${foot + ry * 0.1}`)
  const shape = `<polygon points="${pts.join(' ')}"/>`
  const box = { x: x - rx * 1.06, y: foot - ry * 1.06, w: rx * 2.12, h: ry * 1.2 }
  if (glow) await aura(c, shape, box, ink.lit, glow, Math.max(8, Math.min(rx, ry) * 0.35))
  const p = await patch(shape, box, blur)
  // Lit from above and a little right, darkest underneath and round the far side.
  const lx = x + rx * 0.25
  const ly = foot - ry * 0.98
  lay(c, p, ink.ramp, (px, py) => Math.hypot((px - lx) / rx, (py - ly) / ry) * 0.9 + Math.max(0, (py - foot + ry * 0.35) / (ry * 0.35)) ** 1.5 * 0.3)
  if (ry > 22) {
    const spacing = Math.min(12, Math.max(5, ry / 26)) * (0.7 + 0.3 * fine)
    const step = Math.max(1.1, spacing / 4.5)
    const turn = c.between(0, Math.PI)
    const s0 = c.between(0, 9)
    const s1 = c.between(0, 9)
    const s2 = c.between(0, 9)
    const ridges: Dot[] = []
    for (let gy = p.y; gy < p.y + p.h; gy += step) {
      for (let gx = p.x; gx < p.x + p.w; gx += step) {
        const px = gx + c.between(-0.4, 0.4) * step
        const py = gy + c.between(-0.4, 0.4) * step
        if (alphaAt(p, px, py) < 0.85) continue
        // Where on the dome's surface this is, as arc lengths in grooves.
        const lat = Math.asin(Math.min(0.995, Math.max(0, (foot - py) / ry)))
        const lon = Math.asin(Math.min(1, Math.max(-1, (px - x) / (rx * Math.max(0.1, Math.cos(lat))))))
        const a = (lon * rx) / spacing
        const b = (lat * ry) / spacing
        const phase = a * Math.cos(turn) + b * Math.sin(turn) + 3.2 * Math.sin(a * 0.13 + s0) * Math.sin(b * 0.11 + s1) + 2.1 * Math.sin((a + b) * 0.09 + s2)
        const g = phase - Math.floor(phase)
        if (g < 0.32) ridges.push({ x: px, y: py, r: step * c.between(0.45, 0.7), colour: ink.dark, alpha: c.between(0.4, 0.75) })
        else if (g > 0.5 && g < 0.72 && c.chance(0.55)) ridges.push({ x: px, y: py, r: step * c.between(0.35, 0.6), colour: ink.lit, alpha: c.between(0.2, 0.45) })
      }
    }
    c.dots(ridges)
  }
  polyps(c, p, ink, Math.round(rx * ry * 0.03 * fine), Math.min(1.4, Math.max(0.6, ry / 160)))
  await overspray(c, shape, p, [ink.body, ink.lit], { reach: 3 + blur * 2, count: Math.round((rx + ry) * 2.2), size: Math.max(0.7, fine) })
  return { outline: shape, patches: [p] }
}

/**
 * Staghorn coral: stout branches forking upward from (x, foot), shaded from
 * the underside to a lit edge, crusted with polyps, pale at the growing tips.
 */
export async function staghorn(c: Canvas, { x, foot, h, colour, depth, spread = 1, water = HAZE, glow = 0 }: { x: number; foot: number; h: number; colour: string; depth: number; spread?: number; water?: string; glow?: number }): Promise<Coral> {
  const { haze, blur, fine } = look(depth)
  const ink = tone(colour, haze, water)
  const tip = mix(mix(colour, '#ffffff', 0.7), water, haze)
  type Seg = { x1: number; y1: number; x2: number; y2: number; w: number }
  const segs: Seg[] = []
  const tips: Seg[] = []
  const grow = (x1: number, y1: number, a: number, len: number, w: number, level: number) => {
    const x2 = x1 + Math.sin(a) * len
    const y2 = y1 - Math.cos(a) * len
    const seg = { x1, y1, x2, y2, w }
    segs.push(seg)
    if (level >= 4 || len < h * 0.06) {
      tips.push(seg)
      return
    }
    const n = c.chance(0.3) ? 3 : 2
    for (let i = 0; i < n; i++) {
      const da = (i - (n - 1) / 2) * c.between(0.45, 0.7) * spread
      grow(x2, y2, a * 0.7 + da + c.between(-0.1, 0.1), len * c.between(0.66, 0.82), w * 0.8, level + 1)
    }
  }
  const trunks = c.pick([2, 3, 3, 4])
  for (let i = 0; i < trunks; i++) {
    const side = i - (trunks - 1) / 2
    grow(x + side * h * 0.08, foot, side * 0.35 * spread + c.between(-0.15, 0.15), h * c.between(0.26, 0.32), h * 0.075, 0)
  }
  const pad = h * 0.08
  const xs = segs.flatMap((s) => [s.x1, s.x2])
  const ys = segs.flatMap((s) => [s.y1, s.y2])
  const box = { x: Math.min(...xs) - pad, y: Math.min(...ys) - pad, w: Math.max(...xs) - Math.min(...xs) + pad * 2, h: Math.max(...ys) - Math.min(...ys) + pad * 2 }
  const top = Math.min(...ys)
  const fall = (py: number) => Math.min(1, Math.max(0, (py - top) / (foot - top)))
  const strokes = (along: number, width: number) =>
    segs
      .map((s) => {
        const dx = LIGHT.x * s.w * along
        const dy = LIGHT.y * s.w * along
        return `<line x1="${(s.x1 + dx).toFixed(1)}" y1="${(s.y1 + dy).toFixed(1)}" x2="${(s.x2 + dx).toFixed(1)}" y2="${(s.y2 + dy).toFixed(1)}" stroke-width="${(s.w * width).toFixed(1)}" stroke-linecap="round"/>`
      })
      .join('')
  // Shadow side, body, lit edge: each a narrower stroke nudged towards the sun.
  const outline = strokes(0, 1)
  if (glow) await aura(c, outline, box, ink.lit, glow, Math.max(8, h * 0.06))
  const whole = await patch(outline, box, blur)
  lay(c, whole, ink.ramp, (_, py) => 0.7 + 0.28 * fall(py))
  lay(c, await patch(strokes(0.13, 0.7), box, blur), ink.ramp, (_, py) => 0.32 + 0.3 * fall(py))
  lay(c, await patch(strokes(0.24, 0.3), box, blur * 1.4), ink.ramp, (_, py) => 0.04 + 0.3 * fall(py), 0.85)
  // Pale growing tips.
  const tipPatch = await patch(tips.map((s) => `<circle cx="${s.x2.toFixed(1)}" cy="${s.y2.toFixed(1)}" r="${(s.w * 0.44).toFixed(1)}"/>`).join(''), box, blur)
  lay(c, tipPatch, flat(tip), () => 0, 0.9)
  // Corallites: little cups crusting every branch.
  const cups: Dot[] = []
  for (const s of segs) {
    const len = Math.hypot(s.x2 - s.x1, s.y2 - s.y1)
    for (let k = 0; k < (len / 3.2) * fine; k++) {
      const t = c.random()
      const side = c.between(-0.42, 0.42) * s.w
      const nx = -(s.y2 - s.y1) / len
      const ny = (s.x2 - s.x1) / len
      const lit = side * (nx * LIGHT.x + ny * LIGHT.y) > 0
      cups.push({ x: s.x1 + (s.x2 - s.x1) * t + nx * side, y: s.y1 + (s.y2 - s.y1) * t + ny * side, r: c.between(0.6, 1.3) * Math.max(0.6, fine), colour: lit ? ink.lit : ink.dark, alpha: c.between(0.25, 0.6) })
    }
  }
  c.dots(cups)
  await overspray(c, outline, whole, [ink.body, tip], { reach: 2.5 + blur * 2, count: segs.length * 14, size: Math.max(0.7, fine) })
  return { outline, patches: [whole] }
}

/**
 * A sea fan (gorgonian): a short trunk forking again and again into a flat
 * fan, the branches netted by fine cross-links and dotted with polyps.
 * Rooted at (x, foot), `w` wide and `h` tall.
 */
export async function seaFan(c: Canvas, { x, foot, w, h, colour, depth, water = HAZE, glow = 0 }: { x: number; foot: number; w: number; h: number; colour: string; depth: number; water?: string; glow?: number }): Promise<Coral> {
  const { haze, blur, fine } = look(depth)
  const ink = tone(colour, haze, water)
  const open = 1.2 // how far round from upright the fan opens, in radians
  const at = (rho: number, theta: number): [number, number] => [x + Math.sin(theta) * rho * (w / 2), foot - Math.cos(theta) * rho * h]
  type Limb = { from: number; to: number; angle: (rho: number) => number; width: number }
  const limbs: Limb[] = []
  const grow = (from: number, start: number, lo: number, hi: number, level: number) => {
    const target = level === 0 ? 0 : (lo + hi) / 2 + c.between(-0.12, 0.12) * (hi - lo)
    const last = level === 4
    const to = last ? c.between(0.84, 1) : Math.min(0.9, from + (level === 0 ? 0.1 : c.between(0.13, 0.22)))
    const wobble = c.between(0, 9)
    const angle = (rho: number) => {
      const t = Math.min(1, Math.max(0, (rho - from) / (to - from)))
      return start + (target - start) * (1 - (1 - t) ** 2) + 0.012 * Math.sin(rho * 30 + wobble)
    }
    limbs.push({ from, to, angle, width: [0.022, 0.014, 0.0095, 0.0065, 0.0045][level] * h })
    if (last) return
    const n = level === 0 ? 3 : 2
    for (let i = 0; i < n; i++) grow(to, target, lo + ((hi - lo) * i) / n, lo + ((hi - lo) * (i + 1)) / n, level + 1)
  }
  grow(0, 0, -open, open, 0)
  const limbPath = (l: Limb, dx = 0, dy = 0) => {
    let d = ''
    for (let rho = l.from; rho <= l.to + 1e-6; rho += 0.02) {
      const [px, py] = at(rho, l.angle(rho))
      d += `${d ? 'L' : 'M'}${(px + dx).toFixed(1)} ${(py + dy).toFixed(1)} `
    }
    return d
  }
  let branches = ''
  let lit = ''
  for (const l of limbs) {
    branches += `<path d="${limbPath(l)}" fill="none" stroke-width="${Math.max(1, l.width).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>`
    if (l.width > 3) lit += `<path d="${limbPath(l, LIGHT.x * l.width * 0.2, LIGHT.y * l.width * 0.2)}" fill="none" stroke-width="${(l.width * 0.4).toFixed(1)}" stroke-linecap="round"/>`
  }
  // The net: cross-links between neighbouring branches, row after row.
  let links = ''
  const cups: Dot[] = []
  for (let rho = 0.24; rho < 1; rho += 0.026 + c.between(-0.004, 0.004)) {
    const here = limbs
      .filter((l) => l.from <= rho && rho < l.to)
      .map((l) => l.angle(rho))
      .sort((a, b) => a - b)
    for (let i = 0; i + 1 < here.length; i++) {
      if (here[i + 1] - here[i] > 0.42 || c.chance(0.12)) continue
      const r2 = rho + c.between(-0.008, 0.008)
      const [x1, y1] = at(r2, here[i])
      const [x2, y2] = at(r2, here[i + 1])
      const [mx, my] = at(r2 - 0.01, (here[i] + here[i + 1]) / 2)
      links += `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke-width="${Math.max(0.9, h * 0.0022).toFixed(1)}"/>`
      if (c.chance(0.5 * fine)) cups.push({ x: mx, y: my, r: Math.max(0.6, h * 0.0016), colour: ink.lit, alpha: c.between(0.4, 0.85) })
    }
  }
  for (const l of limbs) {
    for (let rho = l.from; rho < l.to; rho += 0.012 / fine) {
      if (!c.chance(0.55)) continue
      const [px, py] = at(rho, l.angle(rho))
      cups.push({ x: px + c.between(-0.4, 0.4) * l.width, y: py + c.between(-0.4, 0.4) * l.width, r: Math.max(0.6, Math.min(l.width * 0.3, h * 0.002)), colour: ink.lit, alpha: c.between(0.4, 0.9) })
    }
  }
  const box = { x: x - w * 0.55, y: foot - h * 1.02, w: w * 1.1, h: h * 1.05 }
  const fanBlur = Math.min(blur, 0.8 + depth * 2.2)
  if (glow) await aura(c, branches + links, box, ink.lit, glow, Math.max(8, h * 0.035))
  const p = await patch(branches + links, box, fanBlur)
  lay(c, p, ink.ramp, (_, py) => 0.22 + 0.5 * ((py - (foot - h)) / h))
  if (lit) lay(c, await patch(lit, box, fanBlur), ink.ramp, () => 0.05, 0.75)
  c.dots(cups)
  return { outline: branches + links, patches: [p] }
}

/**
 * Plate coral: thin lobed plates in terraces, seen from a little above.
 * Each tier sits higher and further back, towards where the colony grows
 * from (`root` -1 left, 1 right; 0 a free-standing whorl), and overhangs
 * the one below: its lit top ringed with growth lines and ridged back
 * towards the join, a pale frill along its growing edge, a shadowed lip
 * under the front, and its shadow thrown on the tier beneath. How much of
 * each top shows depends on how far below the eye (`eye`) it is.
 */
export async function plates(c: Canvas, { x, foot, w, h, colour, depth, tiers = 4, root = 0, eye = c.H * 0.6, water = HAZE, glow = 0 }: { x: number; foot: number; w: number; h: number; colour: string; depth: number; tiers?: number; root?: number; eye?: number; water?: string; glow?: number }): Promise<Coral> {
  const { haze, blur, fine } = look(depth)
  const ink = tone(colour, haze, water)
  const frill = mix(mix(colour, '#ffffff', 0.72), water, haze)
  const shade = mix(mix(colour, SHADOW, 0.75), water, haze)
  const painted: Coral = { outline: '', patches: [] }
  // The bottom tier first: each one above overhangs it.
  for (let i = 0; i < tiers; i++) {
    const t = tiers > 1 ? i / (tiers - 1) : 0
    const rx = (w / 2) * (1 - t * 0.38) * c.between(0.9, 1.06)
    const tilt = Math.min(0.3, Math.max(0.08, (foot - h * t * 0.8 - eye) / (c.H * 0.9) + 0.1))
    const ry = rx * tilt
    const cy = foot - ry - h * 0.8 * t + c.between(-0.02, 0.02) * h
    // Higher tiers step back towards the join.
    const cx = x + root * (w / 2) * (t * 0.42 - 0.08) + c.between(-0.05, 0.05) * w
    const joinX = root ? cx + root * rx * 0.85 : cx
    const lip = Math.max(2.5, rx * 0.05)
    const phase = c.between(0, 9)
    const outline = (dy: number) => {
      const pts: string[] = []
      for (let k = 0; k < 120; k++) {
        const th = (k / 120) * Math.PI * 2
        // Lobed and frilled, most at the free edge, away from the join.
        const free = root ? Math.min(1, Math.max(0, 0.5 - 0.5 * Math.cos(th) * root)) : 1
        const fr = 1 + free * (0.06 * Math.sin(th * 6 + phase) + 0.025 * Math.sin(th * 17 + phase * 2))
        pts.push(`${(cx + Math.cos(th) * rx * fr).toFixed(1)},${(cy + dy + Math.sin(th) * ry * fr).toFixed(1)}`)
      }
      return `<polygon points="${pts.join(' ')}"/>`
    }
    const box = { x: cx - rx * 1.12, y: cy - ry * 1.15, w: rx * 2.24, h: ry * 2.5 + lip * 3 }
    // The shadow it throws on the tier below, then its lip, then its top.
    if (i > 0) lay(c, await patch(outline(lip + ry * 0.45), box, Math.max(3, ry * 0.25)), flat(shade), () => 0, 0.55)
    const under = await patch(outline(lip), box, blur)
    lay(c, under, ink.ramp, (px) => 0.74 + 0.22 * Math.max(0, 1 - Math.abs(px - joinX) / (rx * 1.4)))
    const topShape = outline(0)
    if (glow) await aura(c, topShape, box, ink.lit, glow, Math.max(8, rx * 0.2))
    const p = await patch(topShape, box, blur)
    painted.outline += topShape
    painted.patches.push(p)
    lay(c, p, ink.ramp, (px, py) => {
      const back = 1 - (py - (cy - ry)) / (2 * ry) // 1 at the back edge, 0 at the front
      const near = Math.max(0, 1 - Math.abs(px - joinX) / (rx * 1.2))
      return 0.03 + 0.12 * Math.abs((px - cx) / rx - 0.35) + (root ? 0.38 * near ** 1.6 : 0.2 * back * (1 - Math.abs(px - cx) / rx))
    })
    // Growth rings round the join, and ridges running out from it.
    const marks: Dot[] = []
    const reach = root ? 2 : 1
    const rings = Math.max(3, Math.round(rx / 14))
    for (let k = 1; k <= rings; k++) {
      const f = (k / (rings + 0.5)) * reach
      for (let th = 0; th < Math.PI * 2; th += 2.2 / Math.max(8, rx * f)) {
        const px = joinX + Math.cos(th) * rx * f
        const py = cy + Math.sin(th) * ry * f
        if (alphaAt(p, px, py) > 0.85 && c.chance(0.75)) marks.push({ x: px, y: py, r: c.between(0.5, 1) * fine + 0.25, colour: ink.dark, alpha: c.between(0.2, 0.4) })
      }
    }
    for (let k = 0; k < rx / 4; k++) {
      const th = c.random() * Math.PI * 2
      for (let q = 0.06; q < reach; q += 2.4 / Math.max(10, rx)) {
        const px = joinX + Math.cos(th) * rx * q
        const py = cy + Math.sin(th) * ry * q
        if (alphaAt(p, px, py) > 0.85 && c.chance(0.6)) marks.push({ x: px, y: py, r: c.between(0.4, 0.9) * fine + 0.2, colour: ink.lit, alpha: c.between(0.25, 0.5) })
      }
    }
    c.dots(marks)
    // The growing edge: a pale frill round the rim, away from the join.
    const edge: Dot[] = []
    for (let k = 0; k < rx * 3 * fine; k++) {
      const th = c.random() * Math.PI * 2
      if (root && Math.cos(th) * root > 0.3) continue
      const px = cx + Math.cos(th) * rx * c.between(0.93, 1.02)
      const py = cy + Math.sin(th) * ry * c.between(0.88, 1.03)
      if (alphaAt(p, px, py) > 0.3) edge.push({ x: px, y: py, r: c.between(0.7, 1.5) * Math.max(0.6, fine), colour: frill, alpha: c.between(0.45, 0.95) })
    }
    c.dots(edge)
    polyps(c, p, ink, Math.round(rx * ry * 0.06 * fine), fine)
    await overspray(c, topShape, p, [ink.body, frill], { reach: 2.5 + blur * 2, count: Math.round(rx * 1.6), size: Math.max(0.7, fine) })
  }
  return painted
}

/** A row of small coral heads standing on `foot`, of every kind, `gap` apart. */
async function row(c: Canvas, { from, to, foot, gap, size, depth }: { from: number; to: number; foot: number; gap: [number, number]; size: number; depth: number }) {
  for (let x = from; x < to; x += c.between(gap[0], gap[1])) {
    const s = size * c.between(0.5, 1.1)
    const f = foot + c.between(-0.1, 0.12) * s
    const colour = c.pick(KINDS)
    const kind = c.random()
    if (kind < 0.45) await brain(c, { x, foot: f, rx: s * c.between(0.8, 1.6), ry: s * c.between(0.55, 0.8), colour, depth })
    else if (kind < 0.72) await staghorn(c, { x, foot: f, h: s * 1.3, colour, depth })
    else if (kind < 0.9) await seaFan(c, { x, foot: f, w: s * 1.3, h: s * 1.5, colour, depth })
    else await plates(c, { x, foot: f, w: s * 1.8, h: s * 0.9, colour, depth, tiers: 2, eye: foot - s })
  }
}

/* ---- Light ---- */

/** A stable pseudo-random number in [0, 1) for a grid cell. */
function hash(i: number, j: number, seed: number) {
  let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(seed, 982451653)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/**
 * Caustics: a net of light on a plane in perspective, the bright seams
 * between wobbly cells (F2 − F1 Worley noise). Cells are `cell` px across
 * at the `near` row and shrink towards the `vanish` line; the net fades
 * where they get too small to read. Returns a few of the brightest points.
 */
export function net(c: Canvas, { top, bottom, near, vanish, cell, width, colour, strength, seed, fade }: { top: number; bottom: number; near: number; vanish: number; cell: number; width: number; colour: string; strength: number; seed: number; fade: (y: number) => number }) {
  const { W, H } = c
  const { data } = c.img
  const [r, g, b] = rgbOf(colour)
  const D = Math.abs(near - vanish)
  const bright: Dot[] = []
  for (let y = Math.max(0, Math.floor(top)); y < Math.min(H, bottom); y++) {
    const d = Math.abs(y - vanish)
    const tall = cell * (d / D) ** 2
    const f = fade(y) * Math.min(1, Math.max(0, (tall - 4) / 20)) * strength
    if (f <= 0.005) continue
    const gv = (D * D) / (d * cell)
    for (let x = 0; x < W; x++) {
      const gu = ((x - W / 2) * D) / (d * cell)
      // Warp the grid so the cells are pebbles, not tiles.
      const wu = gu + 0.24 * Math.sin(gv * 1.9 + seed) + 0.1 * Math.sin(gv * 4.3 + gu * 1.1)
      const wv = gv + 0.24 * Math.sin(gu * 1.6 + seed * 2) + 0.1 * Math.sin(gu * 3.7 - gv * 0.9)
      const iu = Math.floor(wu)
      const iv = Math.floor(wv)
      let f1 = 9
      let f2 = 9
      for (let j = -1; j <= 1; j++) {
        for (let i = -1; i <= 1; i++) {
          const cu = iu + i
          const cv = iv + j
          const du = wu - (cu + 0.12 + 0.76 * hash(cu, cv, seed))
          const dv = wv - (cv + 0.12 + 0.76 * hash(cv, cu, seed + 1))
          const dd = du * du + dv * dv
          if (dd < f1) {
            f2 = f1
            f1 = dd
          } else if (dd < f2) f2 = dd
        }
      }
      const edge = Math.sqrt(f2) - Math.sqrt(f1)
      if (edge >= width) continue
      const a = (1 - edge / width) ** 2 * f
      const o = (y * W + x) * 4
      data[o] += (r - data[o]) * a
      data[o + 1] += (g - data[o + 1]) * a
      data[o + 2] += (b - data[o + 2]) * a
      if (a > 0.85 * f && f > 0.2 && c.chance(0.0015)) bright.push({ x, y, r: 1.2 + (tall / cell) * 1.5, colour: '#ffffff', alpha: 1 })
    }
  }
  return bright
}

/* ---- Fish ---- */

/** A point on a quadratic curve, its normal and its direction: [x, y, nx, ny, tx, ty]. */
function curve(p0: [number, number], p1: [number, number], p2: [number, number], t: number) {
  const x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0]
  const y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]
  const dx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0])
  const dy = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1])
  const d = Math.hypot(dx, dy) || 1
  return [x, y, -dy / d, dx / d, dx / d, dy / d] as const
}

/** Roughly normal noise, mean 0 and spread 1. */
const gauss = (c: Canvas) => (c.random() + c.random() + c.random() - 1.5) * 2

/**
 * A school of small silver fish swimming along a curve: dark blue backs,
 * bright flanks, each with a glint the site twinkles. Thickest mid-curve.
 */
async function school(c: Canvas, { from, via, to, count, len, thick }: { from: [number, number]; via: [number, number]; to: [number, number]; count: number; len: [number, number]; thick: number }) {
  let bodies = ''
  let backs = ''
  const glints: Dot[] = []
  const xs: number[] = []
  const ys: number[] = []
  for (let i = 0; i < count; i++) {
    const t = c.random()
    const [px, py, nx, ny, tx, ty] = curve(from, via, to, t)
    const off = gauss(c) * thick * (0.25 + Math.sin(Math.PI * t))
    const x = px + nx * off
    const y = py + ny * off
    const L = c.between(len[0], len[1]) * (0.8 + 0.4 * t)
    // Heads point along the curve; the body is drawn tail to the right.
    const angle = (Math.atan2(-ty, -tx) * 180) / Math.PI + c.between(-8, 8)
    const at = `transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(1)})"`
    bodies += `<path ${at} d="M${-L / 2} 0 C ${-L * 0.3} ${-L * 0.16} ${L * 0.15} ${-L * 0.14} ${L * 0.32} 0 L ${L * 0.5} ${-L * 0.13} L ${L * 0.44} 0 L ${L * 0.5} ${L * 0.13} L ${L * 0.32} 0 C ${L * 0.15} ${L * 0.14} ${-L * 0.3} ${L * 0.14} ${-L / 2} 0 Z"/>`
    backs += `<path ${at} d="M${-L * 0.44} ${-L * 0.03} C ${-L * 0.25} ${-L * 0.15} ${L * 0.15} ${-L * 0.13} ${L * 0.32} 0 C ${L * 0.1} ${-L * 0.05} ${-L * 0.2} ${-L * 0.05} ${-L * 0.44} ${-L * 0.03} Z"/>`
    const rad = (angle * Math.PI) / 180
    glints.push({ x: x - Math.cos(rad) * L * 0.08 + Math.sin(rad) * L * 0.03, y: y - Math.sin(rad) * L * 0.08 - Math.cos(rad) * L * 0.03 + L * 0.02, r: L * 0.06, colour: '#ffffff', alpha: 0.95 })
    xs.push(x)
    ys.push(y)
  }
  const pad = len[1] * 1.4
  const box = { x: Math.min(...xs) - pad, y: Math.min(...ys) - pad, w: Math.max(...xs) - Math.min(...xs) + pad * 2, h: Math.max(...ys) - Math.min(...ys) + pad * 2 }
  lay(c, await patch(bodies, box, 0.7), flat('#d6ecf4'), () => 0, 0.95)
  lay(c, await patch(backs, box, 0.8), flat('#35699c'), () => 0, 0.85)
  c.dots(glints)
  return glints
}

/**
 * A big reef fish, airbrushed rather than flat: a body shaded from a dark
 * back through a lit band on the flank to a pale belly, misted fins with
 * their rays drawn in, soft markings, scales, and an eye with a
 * catch-light. Drawn in a 200 × 140 box facing right, centred on (x, y),
 * `len` long; paints onto the scene or onto a transparent layer.
 */
async function bigFish(c: Canvas, kind: 'parrot' | 'tang', { x, y, len, right, haze }: { x: number; y: number; len: number; right: boolean; haze: number }) {
  const s = len / 200
  const ox = right ? x - len / 2 : x + len / 2
  const oy = y - 70 * s
  const g = (inner: string) => `<g transform="translate(${ox.toFixed(1)} ${oy.toFixed(1)}) scale(${right ? s : -s} ${s})">${inner}</g>`
  const local = (px: number, py: number) => [right ? (px - ox) / s : (ox - px) / s, (py - oy) / s] as const
  const box = { x: x - len / 2, y: y - len * 0.36, w: len, h: len * 0.72 }
  const hazed = (hex: string) => mix(hex, HAZE, haze)
  const ramp = (lit: string, body: string, dark: string): Ramp => [rgbOf(hazed(lit)), rgbOf(hazed(body)), rgbOf(hazed(dark))]
  /** One part, shaded by `t` in the fish's own box. */
  const part = async (inner: string, colours: Ramp, t: (lx: number, ly: number) => number, { blur = 1, opacity = 1 } = {}) => {
    const p = await patch(g(inner), box, blur * s + 0.4)
    lay(c, p, colours, (px, py) => t(...local(px, py)), opacity)
    return p
  }
  /** A fin, pale at its root and deepening to its edge, with its rays. */
  const fin = async (d: string, root: [number, number], reach: number, colours: Ramp, opacity = 0.92) => {
    await part(`<path d="${d}"/>`, colours, (lx, ly) => 0.1 + 0.85 * Math.min(1, Math.hypot(lx - root[0], ly - root[1]) / reach), { blur: 1.1, opacity })
    let rays = ''
    for (let a = -Math.PI; a < Math.PI; a += 0.13) rays += `<line x1="${root[0]}" y1="${root[1]}" x2="${root[0] + Math.cos(a) * 160}" y2="${root[1] + Math.sin(a) * 160}" stroke-width="0.9"/>`
    const id = c.id('fin')
    await part(`<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${rays}</g>`, colours, () => 1, { blur: 0.5, opacity: 0.35 * opacity })
  }
  /** The body: dark along the back, a lit band high on the flank, a pale belly. */
  const body = async (d: string, colours: Ramp, top: number, bottom: number) =>
    part(`<path d="${d}"/>`, colours, (_, ly) => {
      const v = (ly - top) / (bottom - top)
      return 0.95 - v * 0.95 - 0.22 * Math.exp(-(((v - 0.3) / 0.13) ** 2))
    }, { blur: 0.9 })
  const mark = async (d: string, colour: string, blur: number, opacity: number) => part(d, flat(hazed(colour)), () => 0, { blur, opacity })
  const eye = async (ex: number, ey: number, r: number, iris: string) => {
    await mark(`<circle cx="${ex}" cy="${ey}" r="${r}"/>`, iris, 0.5, 1)
    await mark(`<circle cx="${ex + r * 0.12}" cy="${ey}" r="${r * 0.56}"/>`, '#0e1638', 0.3, 1)
    const cx = right ? ox + (ex - r * 0.2) * s : ox - (ex - r * 0.2) * s
    c.dots([{ x: cx, y: oy + (ey - r * 0.3) * s, r: Math.max(1, r * 0.24 * s), colour: '#ffffff', alpha: 0.95 }])
  }
  if (kind === 'tang') {
    // Blue tang: royal blue, a dark palette mark sprayed soft, a yellow tail.
    const outline = 'M42 70 C 52 36, 112 22, 156 36 C 174 44, 184 58, 186 70 C 184 82, 174 94, 156 102 C 112 118, 52 104, 42 70 Z'
    await fin('M46 70 C 34 56, 22 44, 10 40 C 16 56, 16 84, 10 100 C 22 96, 34 84, 46 70 Z', [46, 70], 40, ramp('#fff3a8', '#ffd84a', '#e8961a'))
    await fin('M60 42 C 96 18, 142 20, 170 42 L 160 47 C 132 33, 98 33, 66 49 Z', [112, 70], 52, ramp('#5f86ff', '#2a5cff', '#0d1450'))
    await fin('M66 98 C 100 122, 142 118, 168 98 L 158 93 C 132 107, 100 107, 72 92 Z', [116, 70], 52, ramp('#5f86ff', '#2a5cff', '#0d1450'))
    const b = await body(outline, ramp('#8fb3ff', '#2457ff', '#13226e'), 26, 112)
    polyps(c, b, tone(BLUE, haze), Math.round(len * len * 0.012), Math.max(0.6, s * 0.6))
    await mark('<path d="M56 64 C 84 40, 132 34, 164 50 C 140 52, 112 58, 98 70 C 112 76, 134 84, 146 94 C 112 96, 76 88, 56 64 Z"/>', '#0f1748', 3, 0.85)
    await mark('<path d="M150 42 C 158 56, 160 78, 152 96" fill="none" stroke-width="2.4"/>', '#0f1748', 1.6, 0.35)
    await fin('M142 74 C 134 84, 122 92, 112 94 C 120 84, 130 76, 140 70 Z', [141, 72], 34, ramp('#fff3a8', '#ffd84a', '#f0b020'), 0.95)
    await eye(166, 58, 5.4, '#20307a')
    await overspray(c, g(`<path d="${outline}"/>`), b, [hazed('#2a5cff'), hazed('#5f86ff')], { reach: 4, count: Math.round(len * 3), size: Math.max(0.7, s) })
  } else {
    // Parrotfish: turquoise, every scale edged pink, a pale beak, a pink
    // mask round the face, and a crescent tail.
    const outline = 'M36 72 C 42 48, 78 30, 118 28 C 150 26, 172 36, 182 52 C 188 62, 190 72, 186 82 C 180 94, 160 104, 128 106 C 90 108, 50 98, 36 72 Z'
    await fin('M40 68 C 28 52, 16 36, 2 26 C 12 48, 12 92, 2 114 C 16 104, 28 88, 40 76 Z', [40, 72], 44, ramp('#8ff0de', '#36cdb4', '#ff5aa0'))
    await fin('M58 46 C 80 22, 120 10, 156 20 L 160 40 C 126 32, 92 36, 62 50 Z', [110, 72], 58, ramp('#ffc4dc', '#ff8ab8', '#2c6cff'))
    await fin('M80 100 C 98 122, 128 126, 148 110 L 140 98 C 120 106, 100 106, 84 96 Z', [112, 72], 52, ramp('#ffc4dc', '#ff8ab8', '#2c6cff'))
    await fin('M128 100 C 132 110, 126 118, 118 121 C 120 112, 122 106, 124 100 Z', [126, 100], 22, ramp('#ffc4dc', '#ff8ab8', '#2c6cff'))
    const b = await body(outline, ramp('#b4f8e6', '#1dc0a2', '#0a5a7c'), 28, 106)
    // Scales: rows of arcs, each opening towards the head, clipped to the body.
    let arcs = ''
    for (let row = 0, ly = 32; ly < 108; row++, ly += 7.5) {
      for (let lx = 44 + (row % 2) * 5; lx < 152; lx += 10) arcs += `<path d="M${lx + 2} ${ly - 4.2} Q ${lx - 3.5} ${ly} ${lx + 2} ${ly + 4.2}" fill="none" stroke-width="1.3"/>`
    }
    const clip = c.id('scales')
    await part(`<clipPath id="${clip}"><path d="${outline}"/></clipPath><g clip-path="url(#${clip})">${arcs}</g>`, flat(hazed('#ff9ac4')), () => 0, { blur: 0.5, opacity: 0.5 })
    // The face: pink bands from the beak back to the eye and under the jaw, a darker gill line.
    await mark('<path d="M146 40 C 156 56, 158 76, 150 94" fill="none" stroke-width="2.6"/>', '#0a5a7c', 1.6, 0.45)
    await mark('<path d="M178 60 C 172 54, 168 50, 160 46 M184 84 C 174 88, 162 92, 150 94" fill="none" stroke-width="4.5" stroke-linecap="round"/>', '#ff6aa8', 1.4, 0.85)
    await mark('<path d="M178 64 C 186 62, 193 69, 191 77 C 189 82, 182 84, 177 79 Z"/>', '#ecfff9', 0.9, 0.95)
    await fin('M146 70 C 136 74, 122 82, 112 92 C 126 92, 140 84, 148 78 Z', [146, 74], 38, ramp('#e8fcff', '#bff4ff', '#ff8ab8'), 0.8)
    await eye(164, 52, 5, '#ffb84a')
    await overspray(c, g(`<path d="${outline}"/>`), b, [hazed('#1dc0a2'), hazed('#0e7f8c')], { reach: 4, count: Math.round(len * 2.4), size: Math.max(0.7, s * 0.7) })
  }
}
