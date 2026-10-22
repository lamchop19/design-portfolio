import { hashString, mulberry32 } from './dither'

/*
 * Flora: abstract folk plants, drawn from a seed as SVG.
 *
 * After the folk-art fungus and plant tiles on Marc's board and the mound
 * forms on the 1980 遊 cover: stacked caps, mirrored lobes, fans of fronds,
 * bell clusters and contour-banded stones, mostly symmetric, with dots,
 * scales and veins.
 *
 * Every shape belongs to an ink role. scripts/generate-flora.tsx prints each
 * role as its own 1-bit dithered mask, and the page colours each mask in CSS,
 * so one set of masks prints in either palette (components/flora).
 *
 * Coordinates are in dots: one unit is one bitmap pixel.
 */

export const FLORA_SIZE = { width: 120, height: 150 } as const
/** A second print, two thirds the size, for cells too short for the first. Dithered at its own size, so it stays crisp. */
export const FLORA_SMALL = { width: 80, height: 100 } as const

/** Bottom to top: each role knocks out the ones under it where they overlap. */
export const ROLES = ['base', 'stem', 'body', 'shade', 'accent', 'line', 'spot'] as const
export type Role = (typeof ROLES)[number]

export const FAMILIES = ['shelf', 'twin', 'frond', 'bell', 'stone', 'puff', 'daisy', 'branch', 'fan'] as const
export type Family = (typeof FAMILIES)[number]

/** The full palette's inks; 'paper' prints nothing, so it reads as a knocked-out dot. */
export const INKS = ['blue', 'orange', 'pink', 'green', 'yellow', 'black', 'paper'] as const
export type Ink = (typeof INKS)[number]

/**
 * The airbrush render's pastels (scripts/generate-flora.tsx): soft, sprayed
 * colour after the wildflower paintings and gradient posters on Marc's
 * board, rather than flat riso ink.
 */
export const AIR_COLOURS = {
  blush: '#ffb3cf',
  rose: '#ff6fa3',
  sky: '#8cc8ff',
  cobalt: '#3f6dff',
  lilac: '#c9a8ff',
  butter: '#ffe27a',
  tangerine: '#ff8a4c',
  mint: '#9de8c4',
  leaf: '#5fbf6a',
  cream: '#fff8ec',
  lime: '#c9f54a',
} as const
export type AirColour = keyof typeof AIR_COLOURS

/** How much of each role's area is inked, before dithering. */
const TONE: Record<Role, number> = { base: 0.7, stem: 0.85, body: 1, shade: 0.5, accent: 1, line: 1, spot: 1 }

type Shape = { role: Role; svg: string }

export type FloraDrawing = {
  id: string
  family: Family
  /** SVG markup per role, shapes only (no <svg> wrapper). */
  layers: Partial<Record<Role, string[]>>
  /** The full palette's ink for each role. */
  inks: Record<Role, Ink>
  /** The airbrush render's colour for each role. */
  air: Record<Role, AirColour>
}

const { width: W, height: H } = FLORA_SIZE
const CX = W / 2
const GROUND = H - 4

const n = (v: number) => Math.round(v * 10) / 10

/** Draws one specimen. The same id always draws the same plant. */
export function drawFlora(id: string, family: Family): FloraDrawing {
  const random = mulberry32(hashString(id))
  const between = (lo: number, hi: number) => lo + random() * (hi - lo)
  const int = (lo: number, hi: number) => Math.floor(between(lo, hi + 1))
  const shapes: Shape[] = []
  const add = (role: Role, svg: string) => shapes.push({ role, svg })

  const draw = { shelf, twin, frond, bell, stone, puff, daisy, branch, fan }[family]
  draw({ add, between, int })

  const layers: Partial<Record<Role, string[]>> = {}
  for (const shape of shapes) (layers[shape.role] ??= []).push(shape.svg)
  // The airbrush colours draw from their own seed, so adding them never reshuffles the riso inks.
  return { id, family, layers, inks: pickInks(random), air: pickAir(mulberry32(hashString(`${id}-air`))) }
}

type Pen = {
  add: (role: Role, svg: string) => void
  between: (lo: number, hi: number) => number
  int: (lo: number, hi: number) => number
}

/* ---- Families ---- */

const fill = (d: string) => `<path d="${d}"/>`
const stroke = (d: string, w: number) => `<path d="${d}" fill="none" stroke="#000" stroke-width="${n(w)}" stroke-linecap="round"/>`
const dot = (x: number, y: number, r: number) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}"/>`
/** The same markup, and its mirror image across the centre line. */
const mirrored = (svg: string) => `${svg}<g transform="translate(${W} 0) scale(-1 1)">${svg}</g>`

/** A low mound sitting on the ground. */
function mound(pen: Pen, rx: number, ry: number) {
  pen.add('base', fill(`M${n(CX - rx)} ${GROUND} Q${n(CX - rx)} ${n(GROUND - ry)} ${CX} ${n(GROUND - ry)} Q${n(CX + rx)} ${n(GROUND - ry)} ${n(CX + rx)} ${GROUND} Z`))
}

/** Tiers of caps up one stalk: gill ribs on top, a lighter underside and a band of dots. */
function shelf(pen: Pen) {
  const tiers = pen.int(2, 4)
  const top = pen.between(18, 30)
  const stalk = pen.between(2.5, 4.5)
  mound(pen, pen.between(22, 34), pen.between(7, 12))
  pen.add('stem', fill(`M${n(CX - stalk)} ${GROUND} Q${n(CX - stalk * 0.4)} ${n((GROUND + top) / 2)} ${n(CX - stalk * 0.7)} ${n(top + 6)} L${n(CX + stalk * 0.7)} ${n(top + 6)} Q${n(CX + stalk * 0.4)} ${n((GROUND + top) / 2)} ${n(CX + stalk)} ${GROUND} Z`))

  const span = GROUND - 22 - top
  const widest = pen.between(46, 57)
  const taper = pen.between(0.1, 0.2)
  for (let i = 0; i < tiers; i++) {
    const y = GROUND - 22 - (span * i) / Math.max(1, tiers - 1)
    const w = widest * (1 - i * taper) * pen.between(0.9, 1.05)
    const h = pen.between(16, 24)
    const cap = `M${n(CX - w)} ${n(y)} C${n(CX - w)} ${n(y - h * 1.25)} ${n(CX + w)} ${n(y - h * 1.25)} ${n(CX + w)} ${n(y)} Q${CX} ${n(y + h * 0.3)} ${n(CX - w)} ${n(y)} Z`
    pen.add('body', fill(cap))
    pen.add('shade', fill(`M${n(CX - w * 0.94)} ${n(y)} Q${CX} ${n(y + h * 0.75)} ${n(CX + w * 0.94)} ${n(y)} Q${CX} ${n(y + h * 0.3)} ${n(CX - w * 0.94)} ${n(y)} Z`))
    // Gill ribs fanning from the stalk to the rim.
    const ribs = pen.int(5, 8)
    for (let r = 1; r < ribs; r++) {
      const a = Math.PI * (0.1 + (0.8 * r) / ribs)
      pen.add('accent', stroke(`M${CX} ${n(y - 1)} L${n(CX + Math.cos(a) * w * 0.86)} ${n(y - Math.sin(a) * h * 0.82)}`, 0.9))
    }
    pen.add('line', stroke(cap, 0.8))
    // A band of dots across the cap.
    const step = pen.between(5, 8)
    for (let x = step / 2; x < w * 0.72; x += step) {
      for (const side of [-1, 1]) pen.add('spot', dot(CX + side * x, y - h * 0.58 + Math.cos(x / 9) * 1.5, 1.3))
    }
  }
}

/** Two mirrored lobes on short stems over a mound, scaled with crescents, tufts at their feet. */
function twin(pen: Pen) {
  const d = pen.between(21, 28)
  const rx = pen.between(17, 22)
  const ry = pen.between(30, 40)
  const cy = pen.between(48, 60)
  const left = CX - d

  mound(pen, pen.between(40, 50), pen.between(14, 20))
  // Rings in the mound, like the cut stump between the reference's twin cones.
  for (let r = 3; r < 12; r += 3) pen.add('accent', stroke(`M${n(CX - r)} ${GROUND} A${r} ${n(r * 1.2)} 0 0 1 ${n(CX + r)} ${GROUND}`, 0.9))

  const lobe = `<ellipse cx="${n(left)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}"/>`
  const stemTop = cy + ry - 4
  pen.add('stem', mirrored(fill(`M${n(left - 3)} ${n(stemTop)} L${n(left + 3)} ${n(stemTop)} Q${n(left + 6)} ${n(GROUND - 14)} ${n(CX - 4)} ${n(GROUND - 12)} L${n(CX - 8)} ${n(GROUND - 6)} Q${n(left - 2)} ${n(GROUND - 12)} ${n(left - 3)} ${n(stemTop)} Z`)))
  pen.add('body', mirrored(lobe))
  // Crescent scales in staggered rows.
  let row = 0
  for (let y = cy - ry + 8; y < cy + ry - 6; y += 8, row++) {
    const half = rx * Math.sqrt(Math.max(0, 1 - ((y - cy) / ry) ** 2)) - 5
    for (let x = -half + (row % 2) * 4; x <= half; x += 8) {
      pen.add('shade', mirrored(fill(`M${n(left + x - 3)} ${n(y)} Q${n(left + x)} ${n(y + 4)} ${n(left + x + 3)} ${n(y)} Q${n(left + x)} ${n(y + 2)} ${n(left + x - 3)} ${n(y)} Z`)))
    }
  }
  pen.add('line', mirrored(`<ellipse cx="${n(left)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="none" stroke="#000" stroke-width="0.8"/>`))
  // A spiky tuft where each lobe meets its stem.
  const spikes = pen.int(6, 9)
  let tuft = `M${n(left - rx * 0.9)} ${n(stemTop + 2)}`
  for (let i = 0; i <= spikes; i++) {
    const x = left - rx * 0.9 + (rx * 1.8 * i) / spikes
    tuft += ` L${n(x - rx / spikes)} ${n(stemTop - pen.between(5, 11))} L${n(x)} ${n(stemTop + 2)}`
  }
  pen.add('accent', mirrored(fill(`${tuft} Z`)))
  // Dots round the inside of each lobe's rim.
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 9) pen.add('spot', mirrored(dot(left + Math.cos(a) * (rx - 3.5), cy + Math.sin(a) * (ry - 3.5), 1.1)))
}

/** A fan of fronds out of a pot, with a spray at the heart. */
function frond(pen: Pen) {
  const potTop = GROUND - pen.between(18, 26)
  const potW = pen.between(14, 20)
  pen.add('base', fill(`M${n(CX - potW)} ${n(potTop)} L${n(CX + potW)} ${n(potTop)} L${n(CX + potW * 0.7)} ${GROUND} L${n(CX - potW * 0.7)} ${GROUND} Z`))
  // A woven grid on the pot.
  for (let x = -potW + 4; x < potW; x += 5) pen.add('line', stroke(`M${n(CX + x)} ${n(potTop + 2)} L${n(CX + x * 0.72)} ${GROUND - 1}`, 0.6))
  for (let y = potTop + 5; y < GROUND; y += 5) pen.add('line', stroke(`M${n(CX - potW * 0.9)} ${n(y)} L${n(CX + potW * 0.9)} ${n(y)}`, 0.6))

  const ribs = pen.int(4, 6)
  const length = pen.between(78, 96)
  const width = pen.between(5, 9)
  const bend = pen.between(0.1, 0.35)
  for (let i = 0; i < ribs; i++) {
    const a = (Math.PI / 2.3) * ((i + 0.5) / ribs)
    const x0 = CX - 2
    const y0 = potTop
    const x1 = x0 - Math.sin(a) * length
    const y1 = y0 - Math.cos(a) * length * 0.95
    const mx = (x0 + x1) / 2 - Math.cos(a) * length * bend
    const my = (y0 + y1) / 2 - length * bend * 0.4
    const leaf = `M${n(x0)} ${n(y0)} Q${n(mx - Math.cos(a) * width)} ${n(my + Math.sin(a) * width)} ${n(x1)} ${n(y1)} Q${n(mx + Math.cos(a) * width)} ${n(my - Math.sin(a) * width)} ${n(x0)} ${n(y0)} Z`
    pen.add(i % 2 ? 'shade' : 'body', mirrored(fill(leaf)))
    pen.add('line', mirrored(stroke(`M${n(x0)} ${n(y0)} Q${n(mx)} ${n(my)} ${n(x1)} ${n(y1)}`, 0.7)))
    pen.add('spot', mirrored(dot(x1 + (x0 - x1) * 0.12, y1 + (y0 - y1) * 0.12, 1.6)))
  }
  // The spray at the heart.
  const sprays = pen.int(7, 11)
  for (let i = 0; i < sprays; i++) {
    const a = Math.PI * (-0.42 + (0.84 * i) / (sprays - 1))
    const r = pen.between(10, 20)
    pen.add('accent', stroke(`M${CX} ${n(potTop)} L${n(CX + Math.sin(a) * r)} ${n(potTop - Math.cos(a) * r)}`, 1.2))
  }
}

/** Bell caps on curling stems, speckled, with frilled hems. */
function bell(pen: Pen) {
  mound(pen, pen.between(20, 30), pen.between(8, 12))
  const caps: Array<{ x: number; y: number; w: number; h: number }> = [{ x: CX, y: pen.between(26, 34), w: pen.between(13, 16), h: pen.between(13, 16) }]
  const pairs = pen.int(1, 2)
  for (let i = 0; i < pairs; i++) {
    const w = pen.between(11, 15)
    caps.push({ x: CX - pen.between(26, 34) - i * 4, y: 56 + i * pen.between(26, 32), w, h: w * pen.between(0.9, 1.15) })
  }
  const root = { x: CX, y: GROUND - 8 }
  for (const c of caps) {
    const stem = `M${root.x} ${root.y} C${n(root.x)} ${n(root.y - 30)} ${n(c.x + (CX - c.x) * 0.6)} ${n(c.y + c.h + 26)} ${n(c.x)} ${n(c.y + c.h)}`
    pen.add('stem', c.x === CX ? stroke(stem, 3.2) : mirrored(stroke(stem, 3.2)))
  }
  for (const c of caps) {
    const { x, y, w, h } = c
    const cap = `M${n(x - w)} ${n(y + h)} C${n(x - w)} ${n(y - h * 0.2)} ${n(x - w * 0.6)} ${n(y - h)} ${n(x)} ${n(y - h)} C${n(x + w * 0.6)} ${n(y - h)} ${n(x + w)} ${n(y - h * 0.2)} ${n(x + w)} ${n(y + h)} Z`
    const one = (svg: string) => (x === CX ? svg : mirrored(svg))
    pen.add('body', one(fill(cap)))
    // A frilled hem of half-discs.
    const frills = 5
    let hem = ''
    for (let i = 0; i < frills; i++) {
      const fx = x - w + ((i + 0.5) * 2 * w) / frills
      hem += `<circle cx="${n(fx)}" cy="${n(y + h)}" r="${n(w / frills + 0.6)}"/>`
    }
    pen.add('shade', one(hem))
    pen.add('line', one(stroke(cap, 0.8)))
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (1.15 + (0.7 * i) / 6)
      pen.add('spot', one(dot(x + Math.cos(a) * w * 0.55, y + Math.sin(a) * h * 0.55 + h * 0.15, 1.2)))
    }
    pen.add('accent', one(stroke(`M${n(x)} ${n(y - h * 0.2)} L${n(x)} ${n(y + h * 0.8)}`, 0.9)))
  }
}

/** After the 遊 cover: a mound in nested contour bands, veins branching from its peak. */
function stone(pen: Pen) {
  const h = pen.between(80, 104)
  const wb = pen.between(40, 54)
  const wl = pen.between(14, 30)
  const wr = pen.between(14, 30)
  const lean = pen.between(-8, 8)
  const peak = { x: CX + lean, y: GROUND - h }
  const outline = (s: number) => {
    // Scaled towards the middle of the base, so the bands nest.
    const px = (x: number) => n(CX + (x - CX) * s)
    const py = (y: number) => n(GROUND + (y - GROUND) * s)
    return `M${px(CX - wb)} ${GROUND} C${px(CX - wb)} ${py(GROUND - h * 0.55)} ${px(peak.x - wl)} ${py(peak.y)} ${px(peak.x)} ${py(peak.y)} C${px(peak.x + wr)} ${py(peak.y)} ${px(CX + wb)} ${py(GROUND - h * 0.55)} ${px(CX + wb)} ${GROUND} Z`
  }
  const bands = pen.int(4, 6)
  for (let i = 0; i < bands; i++) {
    const s = 1 - (i * 0.8) / bands
    pen.add(i % 2 ? 'shade' : 'body', fill(outline(s)))
    pen.add('line', stroke(outline(s), 0.8))
  }
  // Veins: a little branching tree up out of the peak, a bud at each tip.
  const vein = (x: number, y: number, angle: number, length: number, depth: number) => {
    const x1 = x + Math.sin(angle) * length
    const y1 = y - Math.cos(angle) * length
    pen.add('accent', stroke(`M${n(x)} ${n(y)} Q${n((x + x1) / 2 + Math.cos(angle) * 3)} ${n((y + y1) / 2)} ${n(x1)} ${n(y1)}`, Math.max(0.8, depth * 0.5)))
    if (depth <= 1 || y1 < 8) {
      pen.add('spot', dot(x1, y1, 1.6))
      return
    }
    vein(x1, y1, angle - pen.between(0.3, 0.6), length * 0.68, depth - 1)
    vein(x1, y1, angle + pen.between(0.3, 0.6), length * 0.68, depth - 1)
  }
  vein(peak.x, peak.y + 4, pen.between(-0.2, 0.2), Math.min(peak.y - 10, pen.between(14, 22)), 3)
  // A few stars scattered in the core, like the constellation in the reference.
  for (let i = 0; i < pen.int(3, 6); i++) pen.add('spot', dot(CX + pen.between(-wb * 0.3, wb * 0.3), GROUND - pen.between(8, h * 0.4), 0.9))
}

/** A fuzzy pom-pom on a thin stem: hundreds of fine rays round a bright core. */
function puff(pen: Pen) {
  const r = pen.between(30, 40)
  const cy = pen.between(r + 6, r + 18)
  const lean = pen.between(-10, 10)
  const cx = CX + lean
  pen.add('stem', stroke(`M${CX} ${GROUND} Q${n(CX - lean)} ${n((GROUND + cy) / 2)} ${n(cx)} ${n(cy)}`, 1.6))
  // A small tuft of blades at the foot.
  for (let i = 0; i < 7; i++) {
    const a = -0.9 + (1.8 * i) / 6
    pen.add('base', stroke(`M${CX} ${GROUND} Q${n(CX + Math.sin(a) * 6)} ${n(GROUND - 8)} ${n(CX + Math.sin(a) * 14)} ${n(GROUND - pen.between(10, 20))}`, 1.4))
  }
  const rays = pen.int(110, 160)
  for (let i = 0; i < rays; i++) {
    const a = (Math.PI * 2 * i) / rays + pen.between(-0.02, 0.02)
    const r0 = r * pen.between(0.15, 0.4)
    const r1 = r * pen.between(0.75, 1.08)
    pen.add(i % 3 ? 'body' : 'shade', stroke(`M${n(cx + Math.cos(a) * r0)} ${n(cy + Math.sin(a) * r0)} L${n(cx + Math.cos(a) * r1)} ${n(cy + Math.sin(a) * r1)}`, 0.7))
  }
  pen.add('accent', dot(cx, cy, r * pen.between(0.22, 0.32)))
  pen.add('spot', dot(cx, cy, r * 0.09))
  for (let i = 0; i < pen.int(3, 6); i++) {
    const a = pen.between(0, Math.PI * 2)
    pen.add('spot', dot(cx + Math.cos(a) * r * 1.25, cy + Math.sin(a) * r * 1.25, pen.between(1, 2)))
  }
}

/** A daisy: a ring of petals round a disc, on a curving stem with two leaves. */
function daisy(pen: Pen) {
  const cy = pen.between(38, 52)
  const petals = pen.int(11, 17)
  const length = pen.between(20, 28)
  const width = pen.between(5, 8)
  const lean = pen.between(-8, 8)
  const cx = CX + lean
  pen.add('stem', stroke(`M${CX} ${GROUND} C${n(CX + lean * 2)} ${n(GROUND - 40)} ${n(cx - lean)} ${n(cy + 40)} ${n(cx)} ${n(cy)}`, 2.4))
  for (const side of [-1, 1]) {
    const y0 = GROUND - pen.between(28, 50)
    const x0 = CX + lean * 0.6
    const x1 = x0 + side * pen.between(22, 30)
    const y1 = y0 - pen.between(10, 20)
    pen.add('base', fill(`M${n(x0)} ${n(y0)} Q${n((x0 + x1) / 2)} ${n(y1 - 8)} ${n(x1)} ${n(y1)} Q${n((x0 + x1) / 2)} ${n(y0 + 4)} ${n(x0)} ${n(y0)} Z`))
  }
  for (let i = 0; i < petals; i++) {
    const a = (360 * i) / petals
    pen.add('body', `<ellipse cx="${n(cx)}" cy="${n(cy - length / 2 - 4)}" rx="${n(width / 2)}" ry="${n(length / 2)}" transform="rotate(${n(a)} ${n(cx)} ${n(cy)})"/>`)
    pen.add('line', stroke(`M${n(cx)} ${n(cy - 6)} L${n(cx)} ${n(cy - length + 2)}`, 0.6).replace('<path', `<path transform="rotate(${n(a)} ${n(cx)} ${n(cy)})"`))
  }
  pen.add('shade', dot(cx, cy, 10))
  pen.add('accent', dot(cx, cy, pen.between(6, 8)))
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8
    pen.add('spot', dot(cx + Math.cos(a) * 3.6, cy + Math.sin(a) * 3.6, 0.9))
  }
}

/** Staghorn coral, after the Saville-Kent plates: thick branches with blunt tips, dotted with polyps. */
function branch(pen: Pen) {
  const grow = (x: number, y: number, angle: number, length: number, width: number, depth: number) => {
    const x1 = x + Math.sin(angle) * length
    const y1 = y - Math.cos(angle) * length
    const bend = pen.between(-6, 6)
    const d = `M${n(x)} ${n(y)} Q${n((x + x1) / 2 + bend)} ${n((y + y1) / 2)} ${n(x1)} ${n(y1)}`
    pen.add('body', stroke(d, width))
    pen.add('shade', stroke(d, width * 0.35))
    for (let t = 0.3; t < 1; t += 0.28) pen.add('spot', dot(x + (x1 - x) * t + pen.between(-1, 1) * width * 0.3, y + (y1 - y) * t, Math.max(0.8, width * 0.14)))
    if (depth <= 0 || y1 < 14) {
      pen.add('accent', dot(x1, y1, width * 0.5))
      return
    }
    const forks = pen.int(2, 3)
    for (let i = 0; i < forks; i++) {
      const spread = forks === 2 ? (i ? 1 : -1) * pen.between(0.3, 0.55) : (i - 1) * pen.between(0.35, 0.55)
      grow(x1, y1, angle + spread, length * pen.between(0.62, 0.8), width * 0.78, depth - 1)
    }
  }
  mound(pen, pen.between(18, 26), pen.between(5, 8))
  grow(CX, GROUND - 2, pen.between(-0.1, 0.1), pen.between(30, 40), pen.between(9, 12), 3)
}

/** A sea fan: a fine lattice of branching veins spread wide on a short trunk, a soft glow behind. */
function fan(pen: Pen) {
  const r = pen.between(48, 56)
  const cy = GROUND - 14
  pen.add('shade', fill(`M${n(CX - r)} ${n(cy)} A${n(r)} ${n(r * 1.05)} 0 0 1 ${n(CX + r)} ${n(cy)} Z`))
  pen.add('stem', stroke(`M${CX} ${GROUND} L${CX} ${n(cy)}`, 4))
  const vein = (x: number, y: number, angle: number, length: number, depth: number) => {
    const x1 = x + Math.sin(angle) * length
    const y1 = y - Math.cos(angle) * length
    pen.add('body', stroke(`M${n(x)} ${n(y)} L${n(x1)} ${n(y1)}`, Math.max(0.8, depth * 0.7)))
    if (depth <= 0) {
      pen.add('spot', dot(x1, y1, 1.2))
      return
    }
    vein(x1, y1, angle - pen.between(0.15, 0.4), length * 0.78, depth - 1)
    vein(x1, y1, angle + pen.between(0.15, 0.4), length * 0.78, depth - 1)
  }
  for (const angle of [-1.1, -0.55, 0, 0.55, 1.1]) vein(CX, cy, angle + pen.between(-0.1, 0.1), r * 0.36, 4)
  pen.add('accent', dot(CX, cy, 3))
}

/* ---- Inks ---- */

/** The full palette's ink per role: distinct where roles touch, after the reference tiles. */
function pickInks(random: () => number): Record<Role, Ink> {
  const pick = <T,>(options: readonly T[], not: T[] = []) => {
    const pool = options.filter((o) => !not.includes(o))
    return pool[Math.floor(random() * pool.length)]
  }
  const body = pick(['blue', 'pink', 'green', 'yellow', 'black'] as Ink[])
  const shade = pick(['blue', 'pink', 'green', 'yellow', 'black'] as Ink[], [body])
  const stem = pick(['green', 'black', 'blue'] as Ink[], [body])
  const base = pick(['black', 'blue', 'green', 'pink'] as Ink[], [body, stem])
  const accent = pick(['orange', 'pink'] as Ink[], [body, shade])
  const line = pick(['orange', 'black'] as Ink[], [accent])
  const spot = body === 'black' || body === 'blue' ? pick(['paper', 'yellow'] as Ink[]) : pick(['paper', 'black'] as Ink[])
  return { base, stem, body, shade, accent, line, spot }
}

/** The airbrush colour per role: a pastel body, a lighter halo, a hot core. */
function pickAir(random: () => number): Record<Role, AirColour> {
  const pick = (options: AirColour[], not: AirColour[] = []) => {
    const pool = options.filter((o) => !not.includes(o))
    return pool[Math.floor(random() * pool.length)]
  }
  const body = pick(['blush', 'sky', 'lilac', 'butter', 'mint', 'rose', 'cobalt'])
  const shade = pick(['cream', 'blush', 'sky', 'lilac', 'butter'], [body])
  const accent = pick(['tangerine', 'rose', 'cobalt', 'lime', 'butter'], [body, shade])
  const stem = pick(['leaf', 'mint', 'sky'], [body])
  const base = pick(['leaf', 'mint', 'lime'], [stem])
  const line = pick(['cream', 'rose', 'cobalt'], [body])
  const spot = pick(['cream', 'butter', 'tangerine'], [accent])
  return { base, stem, body, shade, accent, line, spot }
}

/* ---- SVG for the rasterizer ---- */

/**
 * One role as a standalone SVG for sharp. `knockout` holds the shapes of every
 * role stacked above, cut out of this one so inks never overprint.
 */
export function roleSvg(shapes: string[], tone: number, knockout: string[], size: { width: number; height: number } = FLORA_SIZE) {
  const cut = knockout.length
    ? `<mask id="k"><rect width="${W}" height="${H}" fill="#fff"/><g fill="#000" stroke="#000">${knockout.join('')}</g></mask>`
    : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${W} ${H}">${cut}<g fill="#000" fill-opacity="${tone}" stroke-opacity="${tone}"${knockout.length ? ' mask="url(#k)"' : ''}>${shapes.join('')}</g></svg>`
}

export function toneOf(role: Role) {
  return TONE[role]
}
