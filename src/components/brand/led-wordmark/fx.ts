import { barcodeBars } from '@/components/brand/barcode'
import { GLYPHS } from '@/components/brand/led-matrix'

/**
 * Board effects as frame generators. Each is called once per tick (~30ms) with
 * a frame count and the board's context, and returns the lamps to draw on the
 * overlay that frame. Coordinates are board lamps: x 0…cols-1, y 0…6, and the
 * overlay reaches `field` lamps past the board on every side.
 */
export type Cell = {
  x: number
  y: number
  colour: string
  /** Opacity, 0–1. */
  a?: number
  /** Draw a dark lamp here, hiding whatever is lit underneath. */
  off?: boolean
  /** Stable identity for lamps that move. */
  id?: string
}

export type FxFrame = { cells: Cell[]; hideBase?: boolean; done?: boolean }

export type FxContext = {
  cols: number
  rows: number
  field: { x: number; y: number }
  /** Lit lamps of the name as `x,y` keys, and as a list. */
  lit: Set<string>
  litCells: { x: number; y: number }[]
  /** The name's colour at a column (per-word palettes differ by word). */
  colourAt: (x: number) => string
}

export type Fx = (frame: number, ctx: FxContext) => FxFrame
export type Point = { x: number; y: number }

const PINK = 'var(--brand-pink)'
const BLUE = '#4d8cff'
const GREEN = 'var(--brand-green)'
const TRIO = [PINK, BLUE, GREEN]
const LAMP = 'var(--lamp-on)'
/** A lamp driven past its colour toward white. */
const HOT = 'color-mix(in oklch, var(--lamp-on) 30%, white)'

/** The column between letters, which has no lamps. */
export const isGap = (x: number) => ((x % 6) + 6) % 6 === 5
export const cellKey = (x: number, y: number) => `${x},${y}`

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const pick = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)]
const easeOut = (t: number) => 1 - (1 - t) ** 3
const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)

/** The name's lit lamps, from the same glyph table the board draws with. */
export function nameMask(text: string) {
  const cells: { x: number; y: number }[] = []
  ;[...text.toUpperCase()].forEach((ch, i) =>
    (GLYPHS[ch] ?? GLYPHS[' ']).split('|').forEach((row, y) =>
      [...row].forEach((cell, x) => {
        if (cell === '#') cells.push({ x: i * 6 + x, y })
      }),
    ),
  )
  return { cells, set: new Set(cells.map((c) => cellKey(c.x, c.y))) }
}

/** Every lamp position on the board itself. */
function* boardCells(ctx: FxContext) {
  for (let y = 0; y < ctx.rows; y++) for (let x = 0; x < ctx.cols; x++) if (!isGap(x)) yield { x, y }
}

/** The name drawn by the overlay, for effects that hide the board's own lamps. */
function nameCellsAt(ctx: FxContext, x: number, y: number): Cell | null {
  return ctx.lit.has(cellKey(x, y)) ? { x, y, colour: ctx.colourAt(x) } : null
}

/* --- Click effects ------------------------------------------------------- */

const PLANE = ['....#......', '#...##.....', '###########', '#...##.....', '....#......']

/**
 * A lamp-drawn plane enters from the left at the clicked row, climbs as it
 * crosses and leaves a pink/blue/green contrail from its tail that fades.
 * Lamps around its outline go dark so it reads against the letters.
 */
export function plane(origin: Point): Fx {
  const w = PLANE[0].length
  const startY = clamp(Math.round(origin.y) - 2, -1, 4)
  const trail: { x: number; y: number; born: number; colour: string }[] = []
  let lastX = Number.NEGATIVE_INFINITY

  return (f, ctx) => {
    const travelled = f * 1.6
    const left = Math.floor(travelled) - w - ctx.field.x
    const top = startY - Math.floor(travelled / 20)

    // Lay contrail only while the tail is on the overlay, so the trail can run out once the plane has gone.
    const lastTrail = Math.min(left, ctx.cols + ctx.field.x)
    for (let x = lastX + 1; x <= lastTrail && lastX !== Number.NEGATIVE_INFINITY; x++) {
      TRIO.forEach((colour, k) => trail.push({ x: x - 1, y: top + 1 + k, born: f, colour }))
    }
    lastX = left

    const cells: Cell[] = []
    for (let i = trail.length - 1; i >= 0; i--) {
      const age = f - trail[i].born
      if (age > 40) trail.splice(i, 1)
      else cells.push({ ...trail[i], a: 0.85 * (1 - age / 40) })
    }

    const body = new Set<string>()
    PLANE.forEach((row, dy) => [...row].forEach((c, dx) => c === '#' && body.add(cellKey(left + dx, top + dy))))
    const outline = new Set<string>()
    for (const k of body) {
      const [x, y] = k.split(',').map(Number)
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = cellKey(x + ox, y + oy)
        if (!body.has(n)) outline.add(n)
      }
    }
    for (const k of outline) {
      const [x, y] = k.split(',').map(Number)
      cells.push({ x, y, colour: '', off: true })
    }
    for (const k of body) {
      const [x, y] = k.split(',').map(Number)
      cells.push({ x, y, colour: HOT })
    }

    // Past the right edge of the overlay the plane is clipped away; wait for its trail to fade.
    return { cells, done: left > ctx.cols + ctx.field.x + 1 && trail.length === 0 }
  }
}

/** Rings expand from the click through every lamp: pink, then blue, then green. */
export function shockwave(origin: Point): Fx {
  const starts = [0, 7, 14]
  return (f, ctx) => {
    const cells: Cell[] = []
    let alive = false
    starts.forEach((start, k) => {
      const r = (f - start) * 0.9
      if (r < 0) return
      if (r < 64) alive = true
      const fade = Math.max(0, 1 - r / 60)
      for (let y = -ctx.field.y; y < ctx.rows + ctx.field.y; y++) {
        for (let x = Math.floor(origin.x - r - 1); x <= origin.x + r + 1; x++) {
          if (isGap(x)) continue
          const d = Math.hypot(x - origin.x, (y - origin.y) * 1.1)
          if (Math.abs(d - r) >= 0.6) continue
          cells.push(
            ctx.lit.has(cellKey(x, y)) ? { x, y, colour: HOT, a: 0.5 + fade / 2 } : { x, y, colour: TRIO[k], a: 0.85 * fade },
          )
        }
      }
    })
    return { cells, done: !alive }
  }
}

/** The footer's brand grid unit, two rows deep (see components/brand/pixel-grid.tsx). */
const TILE = ['B.P..GB.', '.B.PG..B']
const TILE_COLOURS: Record<string, string> = { B: BLUE, P: PINK, G: GREEN }

/** A diagonal wipe turns the board into the brand grid, holds, and wipes back. */
export function pattern(): Fx {
  const speed = 2.4
  const hold = 28
  return (f, ctx) => {
    const span = ctx.cols + ctx.rows * 3
    const front = f * speed
    const back = (f - span / speed - hold) * speed
    const cells: Cell[] = []
    for (const { x, y } of boardCells(ctx)) {
      const d = x + y * 3
      if (front > d && back <= d) {
        if (front - d < 2.5) {
          cells.push({ x, y, colour: HOT })
          continue
        }
        const ch = TILE[y % 2][(x - Math.floor(x / 6)) % 8]
        if (ch !== '.') cells.push({ x, y, colour: TILE_COLOURS[ch] })
      } else {
        const lit = nameCellsAt(ctx, x, y)
        if (lit) cells.push(back > d && back - d < 2.5 ? { ...lit, colour: HOT } : lit)
      }
    }
    return { cells, hideBase: true, done: back > span + 3 }
  }
}

/**
 * The name departs: its lamps drop off the bottom with gravity, column by
 * column, then fall back in from above and land with a one-lamp bounce.
 */
export function depart(): Fx {
  const g = 0.06
  const drop = 11
  const fall = Math.sqrt((2 * drop) / g)
  return (f, ctx) => {
    let landed = 0
    const cells: Cell[] = []
    ctx.litCells.forEach((c, n) => {
      const colour = ctx.colourAt(c.x)
      const t = f - c.x * 0.35
      if (t < 0) return cells.push({ ...c, colour, id: `d${n}` })
      if (t < 30) {
        const y = c.y + Math.round(0.5 * g * t * t)
        if (y < ctx.rows + ctx.field.y) cells.push({ x: c.x, y, colour, id: `d${n}` })
        return
      }
      const t2 = t - 40
      if (t2 < 0) return
      let y = c.y
      if (t2 < fall) y = c.y - drop + Math.round(0.5 * g * t2 * t2)
      else if (t2 - fall >= 1 && t2 - fall < 4) y = c.y - 1
      else if (t2 - fall >= 6) landed++
      cells.push({ x: c.x, y: Math.min(y, c.y), colour, id: `d${n}` })
    })
    return { cells, hideBase: true, done: landed === ctx.litCells.length }
  }
}

/** Lamps burst out from the click, briefly off the grid, then snap home. */
export function scatter(origin: Point): Fx {
  const OUT = 12
  const BACK = 22
  let velocity: Point[] | null = null
  return (f, ctx) => {
    velocity ??= ctx.litCells.map((c) => {
      const dx = c.x - origin.x
      const dy = (c.y - origin.y) * 1.6
      const len = Math.hypot(dx, dy) || 1
      const speed = 3 + Math.random() * 4 + 30 / (len + 4)
      return { x: (dx / len) * speed, y: (dy / len) * speed }
    })
    const k = f < OUT ? easeOut(f / OUT) : f < OUT + BACK ? 1 - easeInOut((f - OUT) / BACK) : 0
    const cells = ctx.litCells.map((c, n) => {
      const x = c.x + velocity![n].x * k
      const y = c.y + velocity![n].y * k
      return {
        id: `s${n}`,
        x: k < 0.12 ? Math.round(x) : x,
        y: k < 0.12 ? Math.round(y) : y,
        colour: k > 0.25 ? TRIO[n % 3] : ctx.colourAt(c.x),
      }
    })
    return { cells, hideBase: true, done: f >= OUT + BACK + 2 }
  }
}

/** Three rockets rise from below the board and burst above it in brand colours. */
export function fireworks(origin: Point): Fx {
  const rockets = [
    { dx: -22, start: 0, peak: -3, colour: PINK },
    { dx: 0, start: 9, peak: -4, colour: BLUE },
    { dx: 20, start: 18, peak: -2, colour: GREEN },
  ]
  const rays = 14
  return (f, ctx) => {
    const cells: Cell[] = []
    let alive = false
    const floor = ctx.rows + ctx.field.y - 1
    for (const r of rockets) {
      const x = clamp(Math.round(origin.x + r.dx), 2, ctx.cols - 3)
      const t = f - r.start
      if (t < 0) {
        alive = true
        continue
      }
      const y = floor - t * 0.6
      if (y > r.peak) {
        alive = true
        cells.push({ x, y: Math.round(y) + 2, colour: r.colour, a: 0.25 })
        cells.push({ x, y: Math.round(y) + 1, colour: r.colour, a: 0.5 })
        cells.push({ x, y: Math.round(y), colour: HOT })
        continue
      }
      const bt = t - (floor - r.peak) / 0.6
      if (bt > 28) continue
      alive = true
      const radius = Math.min(5.5, bt * 0.5)
      const a = 1 - bt / 28
      if (bt < 3) cells.push({ x, y: r.peak, colour: HOT })
      for (const ring of [1, 0.55]) {
        for (let i = 0; i < rays; i++) {
          const angle = (i / rays) * Math.PI * 2
          cells.push({
            x: Math.round(x + Math.cos(angle) * radius * ring * 1.3),
            y: Math.round(r.peak + Math.sin(angle) * radius * ring + 0.012 * bt * bt),
            colour: ring === 1 ? r.colour : HOT,
            a: ring === 1 ? a : a * 0.6,
          })
        }
      }
    }
    return { cells, done: !alive }
  }
}

/**
 * The board becomes the name's barcode (the same bars as the boarding pass),
 * a pink scan line reads it, the bars flash green to accept, and it wipes
 * back to the name.
 */
export function barcode(value: string): Fx {
  const { bars, width } = barcodeBars(value)
  let columns: Set<number> | null = null
  return (f, ctx) => {
    columns ??= new Set(
      bars.flatMap(([bx, w]) => {
        const from = Math.floor((bx / width) * ctx.cols)
        const to = Math.max(from, Math.floor(((bx + w) / width) * ctx.cols) - 1)
        return Array.from({ length: to - from + 1 }, (_, i) => from + i)
      }),
    )
    const wipe = 3
    const scanAt = ctx.cols / wipe + 4
    const scan = (f - scanAt) * 2.2
    const acceptAt = scanAt + (ctx.cols + 4) / 2.2
    const backAt = acceptAt + 18
    const front = f * wipe
    const back = (f - backAt) * wipe
    const accepted = f >= acceptAt && f < acceptAt + 10
    const cells: Cell[] = []
    for (const { x, y } of boardCells(ctx)) {
      if (front > x && back <= x) {
        const onScan = Math.abs(x - scan) < 1 && f < acceptAt
        if (columns.has(x)) cells.push({ x, y, colour: onScan ? HOT : accepted ? GREEN : LAMP })
        else if (onScan) cells.push({ x, y, colour: PINK, a: 0.7 })
      } else {
        const lit = nameCellsAt(ctx, x, y)
        if (lit) cells.push(lit)
      }
    }
    return { cells, hideBase: true, done: back > ctx.cols + 2 }
  }
}

/** A stepped wipe swaps lit and dark lamps, holds the name in negative, and wipes back. */
export function invert(): Fx {
  const speed = 3
  const hold = 26
  return (f, ctx) => {
    const front = f * speed
    const back = (f - ctx.cols / speed - hold) * speed
    const cells: Cell[] = []
    for (const { x, y } of boardCells(ctx)) {
      if (front > x && back <= x) {
        if (!ctx.lit.has(cellKey(x, y))) cells.push({ x, y, colour: front - x < 2 ? HOT : ctx.colourAt(x), a: 0.9 })
      } else {
        const lit = nameCellsAt(ctx, x, y)
        if (lit) cells.push(lit)
      }
    }
    return { cells, hideBase: true, done: back > ctx.cols + 2 }
  }
}

/* --- Idle effects (never finish; stopped from outside) -------------------- */

/** Every ~8s a bright column drifts across: dark lamps glow and lit ones flare. */
export function scanline(): Fx {
  const period = 270
  return (f, ctx) => {
    const col = (f % period) * 1.2 - 3
    const cells: Cell[] = []
    if (col < ctx.cols + 3) {
      for (let dx = 0; dx < 3; dx++) {
        const x = Math.floor(col) - dx
        if (x < 0 || x >= ctx.cols || isGap(x)) continue
        for (let y = 0; y < ctx.rows; y++) {
          cells.push(
            ctx.lit.has(cellKey(x, y))
              ? { x, y, colour: HOT, a: [0.9, 0.5, 0.25][dx] }
              : { x, y, colour: LAMP, a: [0.35, 0.18, 0.08][dx] },
          )
        }
      }
    }
    return { cells }
  }
}

/** Dark lamps glint faintly in brand colours, a few at a time. */
export function twinkle(): Fx {
  const life = 24
  const sparks: { x: number; y: number; born: number; colour: string }[] = []
  return (f, ctx) => {
    if (Math.random() < 0.35) {
      const x = Math.floor(Math.random() * ctx.cols)
      const y = Math.floor(Math.random() * ctx.rows)
      if (!isGap(x) && !ctx.lit.has(cellKey(x, y))) sparks.push({ x, y, born: f, colour: pick(TRIO) })
    }
    const cells: Cell[] = []
    for (let i = sparks.length - 1; i >= 0; i--) {
      const age = f - sparks[i].born
      if (age > life) sparks.splice(i, 1)
      else cells.push({ ...sparks[i], a: 0.6 * Math.sin((Math.PI * age) / life) })
    }
    return { cells }
  }
}

/**
 * A slow, dim Game of Life in the dark lamps behind the name. The letters are
 * walls; it reseeds when it dies down or has run long enough to settle.
 */
export function life(): Fx {
  let alive = new Set<string>()
  let generation = 0
  const seed = (ctx: FxContext) => {
    alive = new Set()
    for (const { x, y } of boardCells(ctx)) {
      if (!ctx.lit.has(cellKey(x, y)) && Math.random() < 0.28) alive.add(cellKey(x, y))
    }
    generation = 0
  }
  return (f, ctx) => {
    if (f === 0) seed(ctx)
    if (f > 0 && f % 12 === 0) {
      const next = new Set<string>()
      for (const { x, y } of boardCells(ctx)) {
        if (ctx.lit.has(cellKey(x, y))) continue
        let n = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && alive.has(cellKey(x + dx, y + dy))) n++
        }
        if (n === 3 || (n === 2 && alive.has(cellKey(x, y)))) next.add(cellKey(x, y))
      }
      alive = next
      if (++generation > 90 || alive.size < 10) seed(ctx)
    }
    return {
      cells: [...alive].map((k) => {
        const [x, y] = k.split(',').map(Number)
        return { x, y, colour: LAMP, a: 0.26 }
      }),
    }
  }
}

/** Dim drops run down the dark lamps, passing behind the letters. */
export function rain(): Fx {
  const drops: { x: number; born: number }[] = []
  return (f, ctx) => {
    if (Math.random() < 0.18) {
      const x = Math.floor(Math.random() * ctx.cols)
      if (!isGap(x)) drops.push({ x, born: f })
    }
    const cells: Cell[] = []
    for (let i = drops.length - 1; i >= 0; i--) {
      const head = Math.floor((f - drops[i].born) / 3) - 1
      if (head - 3 > ctx.rows) {
        drops.splice(i, 1)
        continue
      }
      ;[0.4, 0.2, 0.1].forEach((a, k) => {
        const y = head - k
        const x = drops[i].x
        if (y >= 0 && y < ctx.rows && !ctx.lit.has(cellKey(x, y))) cells.push({ x, y, colour: LAMP, a })
      })
    }
    return { cells }
  }
}
