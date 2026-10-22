import type { Painter } from '.'
import { type Dot, glints, palm, type Rect, stops, type Twinkle } from './kit'

/**
 * Poolside, after Nagai's pool paintings: a turquoise pool seen across its
 * width, its floor netted with light, white coping ruled with grout, a chrome
 * ladder and a diving board; behind it a white modernist house, a low block
 * with a ribbon of blinds and a taller wing whose shadow cuts a long
 * diagonal across the low wall; a palm in front, its shadow soft on the wing;
 * a cobalt sky. The blank wall at the left is room for dark type.
 */

const WALL = '#f8f6f1'
const SHADE = '#b7c1de' // shadow on white, blue with the sky
const DEEP = '#8f9cc6' // the deeper shadow in recesses
const BLINDS: [string, string] = ['#e9eef4', '#b9c6d8']

/** Deterministic noise for the caustic net: a hash of a lattice point, 0–1. */
const hash = (i: number, j: number) => {
  let h = Math.imul(i, 374761393) + Math.imul(j, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/** How close (u, v) is to an edge of a jittered cell grid: 0 on an edge. */
const cellEdge = (u: number, v: number) => {
  const iu = Math.floor(u)
  const iv = Math.floor(v)
  let f1 = 9
  let f2 = 9
  for (let dj = -1; dj <= 1; dj++) {
    for (let di = -1; di <= 1; di++) {
      const ci = iu + di
      const cj = iv + dj
      const d = Math.hypot(u - (ci + 0.1 + 0.8 * hash(ci, cj)), v - (cj + 0.1 + 0.8 * hash(ci + 7919, cj - 1049)))
      if (d < f1) {
        f2 = f1
        f1 = d
      } else if (d < f2) f2 = d
    }
  }
  return f2 - f1
}

export const poolside: Painter = async (c) => {
  const { W, H } = c
  // One-point perspective: the eye a little above the deck, looking across the pool.
  const vx = W * 0.75
  const vy = H * 0.4
  const roof = H * 0.275 // the low block's roof slab
  const wallTop = H * 0.296
  const wallBase = H * 0.555
  const wing = { x: W * 0.62, top: H * 0.14, base: H * 0.575 }
  const far = H * 0.6 // the far coping's outer edge
  const water = H * 0.618 // its inner edge: the waterline
  const floor = H * 0.665 // where the far wall meets the floor
  const near = H * 0.93 // the near coping's inner edge
  const nearOut = H * 0.965
  // Lines running away from us, through the vanishing point: the right-hand
  // coping's outer and inner edges, and the foot of the pool's end wall.
  const through = (x0: number, y0: number) => (y: number) => vx + ((x0 - vx) * (y - vy)) / (y0 - vy)
  const out = through(W * 0.83, far)
  const inner = through(W * 0.81, water)
  const foot = through(W * 0.81, floor)

  // Sky: cobalt, paling a little towards the roofs.
  await c.svg(`<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">${stops([
    [0, '#0a35a6'],
    [0.55, '#1652c4'],
    [1, '#3d84dc'],
  ])}</linearGradient></defs><rect width="${W}" height="${wallTop}" fill="url(#sky)"/>`)
  c.stipple({ x: 0, y: 0, w: W, h: wallTop }, { per: 0.006, dark: '#08277f', light: '#d2e6ff', darkAlpha: 0.3, lightAlpha: 0.18, r: [0.6, 1.3] })

  // The low block: a white wall under a thin roof slab, the slab's shadow a
  // band along its top.
  await c.svg(
    `<defs><linearGradient id="wall" x1="0" y1="${wallTop}" x2="0" y2="${wallBase}" gradientUnits="userSpaceOnUse">${stops([
      [0, '#f1efea'],
      [1, WALL],
    ])}</linearGradient></defs>` +
      `<rect x="-20" y="${wallTop}" width="${wing.x + 40}" height="${wallBase - wallTop}" fill="url(#wall)"/>` +
      `<rect x="-20" y="${roof}" width="${wing.x + 40}" height="${wallTop - roof}" fill="#ffffff"/>` +
      `<rect x="-20" y="${roof}" width="${wing.x + 40}" height="3" fill="#d9deea"/>`,
  )
  await c.shape(`<rect x="-20" y="${wallTop}" width="${wing.x + 40}" height="${H * 0.034}"/>`, SHADE, { blur: 1 })

  // A ribbon of clerestory windows, blinds drawn, each set back in its own
  // reveal: shadow along its head and down its right side, cut on the diagonal.
  const ribbon = { x0: W * 0.035, x1: W * 0.6, top: H * 0.352, bottom: H * 0.398 }
  const panes = 9
  const paneW = (ribbon.x1 - ribbon.x0) / panes
  const blindRects: Rect[] = []
  let reveals = ''
  for (let i = 0; i < panes; i++) {
    const x0 = ribbon.x0 + i * paneW + 6
    const x1 = ribbon.x0 + (i + 1) * paneW - 6
    for (let y = ribbon.top; y < ribbon.bottom; y += 7) blindRects.push({ x: x0, y, w: x1 - x0, h: 3.6, colour: BLINDS[1], alpha: 0.9 })
    reveals += `<path d="M${x0} ${ribbon.top} L ${x1} ${ribbon.top} L ${x1} ${ribbon.bottom} L ${x1 - 16} ${ribbon.bottom} L ${x1 - 16} ${ribbon.top + 12} L ${x0 + 12} ${ribbon.top + 12} Z"/>`
  }
  await c.shape(`<rect x="${ribbon.x0}" y="${ribbon.top}" width="${ribbon.x1 - ribbon.x0}" height="${ribbon.bottom - ribbon.top}"/>`, BLINDS[0], { blur: 0.6 })
  c.rects(blindRects)
  await c.shape(reveals, DEEP, { blur: 0.8, opacity: 0.75 })
  // A sill under the ribbon, and its shadow.
  await c.shape(`<rect x="${ribbon.x0 - 10}" y="${ribbon.bottom}" width="${ribbon.x1 - ribbon.x0 + 20}" height="6"/>`, '#ffffff', { blur: 0.6 })
  await c.shape(`<rect x="${ribbon.x0 - 10}" y="${ribbon.bottom + 6}" width="${ribbon.x1 - ribbon.x0 + 20}" height="5"/>`, SHADE, { blur: 1 })

  // The wing's shadow: the sun is high on the right, so the wing throws a long
  // diagonal across the low wall and a sliver across the deck in front of it.
  const diagonal = { x: W * 0.36, y: H * 0.49 } // where the diagonal meets the shadow's upright edge
  const enters = W * 0.505 // where it crosses the top of the wall
  await c.shape(
    `<path d="M${wing.x + 2} ${wallTop} L ${enters} ${wallTop} L ${diagonal.x} ${diagonal.y} L ${diagonal.x} ${wallBase} L ${wing.x + 2} ${wallBase} Z"/>`,
    SHADE,
    { blur: 1.1, opacity: 0.92 },
  )

  // The deck, all round: pale and warm, speckled.
  await c.svg(`<rect y="${wallBase}" width="${W}" height="${H - wallBase + 2}" fill="#f3e6df"/>`)
  c.stipple({ x: 0, y: wallBase, w: W, h: H - wallBase }, { per: 0.012, dark: '#a88a88', light: '#ffffff', darkAlpha: 0.28, lightAlpha: 0.3, r: [0.6, 1.4] })
  await c.shape(`<path d="M${diagonal.x} ${wallBase} L ${wing.x + 2} ${wallBase} L ${wing.x + 2} ${wing.base} Z"/>`, '#c9bcc6', { blur: 1 })

  // The wing: two storeys, set forward, a crisp shadow under its roof edge.
  await c.svg(
    `<defs><linearGradient id="wing" x1="0" y1="${wing.top}" x2="0" y2="${wing.base}" gradientUnits="userSpaceOnUse">${stops([
      [0, '#f4f2ed'],
      [1, '#fcfaf6'],
    ])}</linearGradient></defs>` + `<rect x="${wing.x}" y="${wing.top}" width="${W - wing.x + 20}" height="${wing.base - wing.top}" fill="url(#wing)"/>`,
  )
  await c.shape(`<rect x="${wing.x}" y="${wing.top}" width="${W - wing.x + 20}" height="${H * 0.012}"/>`, '#ffffff', { blur: 0.6 })
  await c.shape(`<rect x="${wing.x}" y="${wing.top + H * 0.012}" width="${W - wing.x + 20}" height="${H * 0.016}"/>`, SHADE, { blur: 1 })
  // Upstairs, three windows with their blinds down.
  const upstairs = [0.655, 0.75, 0.845].map((f) => ({ x0: W * f, x1: W * (f + 0.07), top: H * 0.205, bottom: H * 0.32 }))
  // Downstairs, a wide glass door, blinds half down over dark glass.
  const door = { x0: W * 0.665, x1: W * 0.935, top: H * 0.4, bottom: wing.base, blinds: H * 0.475 }
  const wingBlinds: Rect[] = []
  let wingReveals = ''
  for (const w of upstairs) {
    for (let y = w.top; y < w.bottom; y += 8) wingBlinds.push({ x: w.x0, y, w: w.x1 - w.x0, h: 4, colour: BLINDS[1], alpha: 0.9 })
    wingReveals += `<path d="M${w.x0} ${w.top} L ${w.x1} ${w.top} L ${w.x1} ${w.bottom} L ${w.x1 - 22} ${w.bottom} L ${w.x1 - 22} ${w.top + 16} L ${w.x0 + 16} ${w.top + 16} Z"/>`
  }
  for (let y = door.top; y < door.blinds; y += 8) wingBlinds.push({ x: door.x0, y, w: door.x1 - door.x0, h: 4, colour: BLINDS[1], alpha: 0.9 })
  await c.shape(upstairs.map((w) => `<rect x="${w.x0}" y="${w.top}" width="${w.x1 - w.x0}" height="${w.bottom - w.top}"/>`).join(''), BLINDS[0], { blur: 0.6 })
  await c.svg(
    `<defs><linearGradient id="glass" x1="0" y1="${door.blinds}" x2="0" y2="${door.bottom}" gradientUnits="userSpaceOnUse">${stops([
      [0, '#16376b'],
      [1, '#2f5f9c'],
    ])}</linearGradient></defs>` +
      `<rect x="${door.x0}" y="${door.top}" width="${door.x1 - door.x0}" height="${door.blinds - door.top}" fill="${BLINDS[0]}"/>` +
      `<rect x="${door.x0}" y="${door.blinds}" width="${door.x1 - door.x0}" height="${door.bottom - door.blinds}" fill="url(#glass)"/>` +
      // The sky and the far wall reflected in the glass, on the slant.
      `<path d="M${door.x0 + 40} ${door.bottom} L ${door.x0 + 120} ${door.blinds} L ${door.x0 + 170} ${door.blinds} L ${door.x0 + 90} ${door.bottom} Z" fill="#6d9fd8" opacity="0.45"/>` +
      `<path d="M${door.x0 + 260} ${door.bottom} L ${door.x0 + 330} ${door.blinds} L ${door.x0 + 350} ${door.blinds} L ${door.x0 + 280} ${door.bottom} Z" fill="#8fbbe8" opacity="0.35"/>`,
  )
  c.rects(wingBlinds)
  // Mullions dividing the door into three, its head in shadow.
  await c.shape(
    [1, 2].map((k) => `<rect x="${door.x0 + ((door.x1 - door.x0) * k) / 3 - 4}" y="${door.top}" width="8" height="${door.bottom - door.top}"/>`).join('') +
      `<rect x="${door.x0 - 8}" y="${door.top - 8}" width="${door.x1 - door.x0 + 16}" height="8"/>`,
    '#ffffff',
    { blur: 0.6 },
  )
  wingReveals += `<path d="M${door.x0} ${door.top} L ${door.x1} ${door.top} L ${door.x1} ${door.bottom} L ${door.x1 - 26} ${door.bottom} L ${door.x1 - 26} ${door.top + 20} L ${door.x0 + 20} ${door.top + 20} Z"/>`
  await c.shape(wingReveals, DEEP, { blur: 0.8, opacity: 0.7 })

  // Light thrown up off the pool, a faint net wavering over the foot of the
  // walls, strongest in the shade.
  const bounce = new Float32Array(W * H)
  for (const [x0, x1, top, bottom] of [
    [0, wing.x, wallTop, wallBase],
    [wing.x, W, wing.top, wing.base],
  ]) {
    const reach = (bottom - top) * 0.42
    for (let y = Math.floor(bottom - reach); y < bottom; y++) {
      const rise = (y - (bottom - reach)) / reach
      for (let x = Math.floor(x0); x < x1; x++) {
        const u0 = x / 64
        const v0 = y / 22
        const e = cellEdge(u0 + 0.25 * Math.sin(v0 * 1.7 + u0 * 0.4), v0 + 0.2 * Math.sin(u0 * 2.3))
        bounce[y * W + x] = Math.max(0, 1 - e / 0.07) * rise * rise
      }
    }
  }
  c.paintMask(bounce, '#c4f4f8', 0.5)

  // The palm, standing on the deck to the right of the pool. Its shadow first,
  // soft on the wing's wall: the same shapes, thrown left and down.
  const tree = { x: W * 0.93, base: H * 0.68, top: H * 0.165, lean: -W * 0.02, width: 25, crown: W * 0.13 }
  const p = palm(c, tree)
  const silhouette = p.trunk + p.back + p.fronds + p.leaflets
  const thrown = await c.mask(`<g transform="translate(${-W * 0.2} ${H * 0.11})">${silhouette}</g>`, 5)
  const onWing = await c.mask(`<rect x="${wing.x}" y="${wing.top + H * 0.028}" width="${W - wing.x}" height="${wing.base - wing.top - H * 0.028}"/>`)
  for (let i = 0; i < thrown.length; i++) thrown[i] *= onWing[i]
  c.paintMask(thrown, SHADE, 0.75)

  // The pool. Its far coping's inner edge is the waterline; under the water
  // the far wall, the end wall on the right, and the floor.
  const pool = `<path d="M-20 ${water} L ${inner(water)} ${water} L ${inner(near)} ${near} L -20 ${near} Z"/>`
  await c.svg(`<defs><linearGradient id="floor" x1="0" y1="${floor}" x2="0" y2="${near}" gradientUnits="userSpaceOnUse">${stops([
    [0, '#1fa9d2'],
    [0.5, '#35c2df'],
    [1, '#62d9e9'],
  ])}</linearGradient></defs><g fill="url(#floor)">${pool}</g>`)
  await c.svg(
    `<rect x="-20" y="${water}" width="${inner(water) + 20}" height="${floor - water}" fill="#1993c4"/>` +
      `<path d="M${inner(water)} ${water} L ${inner(near)} ${near} L ${foot(near)} ${near} L ${inner(water)} ${floor} Z" fill="#43c7df"/>`,
  )
  // The waterline band of cobalt mosaic.
  const mosaic: Rect[] = []
  for (let x = -20; x < inner(water); x += 9) {
    for (const row of [0, 1]) mosaic.push({ x, y: water + row * 6, w: 8, h: 5.2, colour: c.pick(['#1b3f9e', '#2552b6', '#163a8e']), alpha: 0.95 })
  }
  c.rects(mosaic)

  // The diving board's shadow on the floor, broken by the ripples.
  const board = { x0: W * 0.725, x1: W * 0.93, y: H * 0.722, stand: W * 0.905 }
  const shadowLine = Array.from({ length: 41 }, (_, i) => {
    const x = board.x0 - W * 0.07 + (i / 40) * (board.x1 - board.x0 - W * 0.04)
    return `${x.toFixed(0)},${(H * 0.785 + Math.sin(i * 0.9) * 4).toFixed(1)}`
  })
  const boardShadow = await c.mask(`<polyline points="${shadowLine.join(' ')}" fill="none" stroke-width="${H * 0.014}"/>`, 3)

  // The caustic net on the floor: a jittered cell grid laid on the floor in
  // perspective and warped, its edges lines of light. Two nets, a little apart,
  // for the doubled lines light makes through moving water.
  const f = W // focal length, px
  const depth = 1.95 // the eye's height over the floor, m
  const cell = 0.48 // m
  const net = new Float32Array(W * H)
  const ghost = new Float32Array(W * H)
  const yStart = Math.floor(water)
  for (let y = yStart; y < Math.ceil(near); y++) {
    const z = (f * depth) / (y - vy)
    const v0 = z / cell
    const onFloor = y >= floor
    const xMax = onFloor ? foot(y) : inner(water)
    for (let x = 0; x < Math.min(W, xMax); x++) {
      const u0 = ((x - vx) * z) / f / cell
      const u = u0 + 0.22 * Math.sin(v0 * 2.1 + u0 * 0.7) + 0.09 * Math.sin(v0 * 5.3 + 1.7)
      const v = v0 + 0.2 * Math.sin(u0 * 1.9 + 0.5) + 0.09 * Math.sin(u0 * 4.7 - v0 * 0.9)
      const bright = 0.55 + 0.45 * Math.sin(u * 0.8 + v * 1.3)
      const width = 0.03 + 0.018 * bright
      const e = cellEdge(u, v)
      const line = Math.pow(Math.max(0, 1 - e / width), 1.4) + 0.22 * Math.max(0, 1 - e / (width * 3.5))
      const i = y * W + x
      const shade = 1 - boardShadow[i] * 0.85
      // On the far wall the net is fainter and stretched: light at a glance.
      const wall = onFloor ? 1 : 0.35
      net[i] = Math.min(1, line * bright) * shade * wall
      const g = cellEdge(u + 0.05, v + 0.04)
      ghost[i] = Math.max(0, 1 - g / (width * 1.6)) * 0.6 * shade * wall
    }
  }
  c.paintMask(boardShadow, '#147ca6', 0.45)
  c.paintMask(ghost, '#9aeef6', 0.4)
  c.paintMask(net, '#e9fdff', 0.85)
  // Speckle riding the brightest lines, as the airbrush leaves it.
  const netDensity = c.sampler(net, 1.6)
  const poolArea = { x: 0, y: water, w: W * 0.9, h: near - water }
  const caustic = c.scatter(9000, netDensity, () => ({ r: c.between(0.7, 1.7), colour: c.pick(['#ffffff', '#e2fbff', '#b9f2f8']), alpha: c.between(0.5, 1) }), poolArea)
  c.dots(caustic)

  // On the surface: the white coping reflected under the far edge in a
  // wobbling line, and glints.
  const reflection: Dot[] = []
  for (let x = 0; x < inner(water); x += 3) {
    const wob = Math.sin(x * 0.05) * 2 + Math.sin(x * 0.013) * 1.5
    if (Math.sin(x * 0.031) > -0.4) reflection.push({ x, y: water + 15 + wob, r: c.between(0.8, 1.8), colour: '#f2fbff', alpha: c.between(0.4, 0.8) })
  }
  c.dots(reflection)
  const surface = glints(c, { top: water + 20, bottom: near - 10, x1: W * 0.86, colour: '#ffffff', per: 0.00028, size: 0.9, alpha: 0.75 })
  c.rects(surface)

  // The ladder at the far side: two chrome rails out of the water and over
  // the coping, bent where they enter the water, steps below.
  const rails = [W * 0.2, W * 0.252]
  const underwater = rails.map((x) => `<path d="M${x + 5} ${water + 2} L ${x + 8} ${H * 0.715}" fill="none" stroke-width="12" stroke-linecap="round"/>`).join('')
  await c.shape(underwater, '#b8e9f2', { blur: 1.2, opacity: 0.55 })
  await c.shape(
    [0.66, 0.7].map((f2) => `<rect x="${rails[0] + 8}" y="${H * f2}" width="${rails[1] - rails[0]}" height="9"/>`).join(''),
    '#a5e3ee',
    { blur: 1.5, opacity: 0.45 },
  )
  const rail = (x: number) => `<path d="M${x} ${water + 4} L ${x} ${H * 0.556} C ${x} ${H * 0.538}, ${x + 8} ${H * 0.532}, ${x + 16} ${H * 0.538} L ${x + 21} ${H * 0.575}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
  await c.svg(
    `<defs><linearGradient id="chrome" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">${stops([
      [0, '#5c6880'],
      [0.35, '#ffffff'],
      [0.6, '#c9d2e0'],
      [1, '#6b7590'],
    ])}</linearGradient></defs>` + rails.map((x) => `<g stroke="url(#chrome)" stroke-width="13">${rail(x)}</g>`).join(''),
  )
  // The rails' own highlight, a hairline down their lit side.
  await c.shape(rails.map((x) => `<path d="M${x - 2.5} ${water} L ${x - 2.5} ${H * 0.556}" fill="none" stroke-width="2.4"/>`).join(''), '#ffffff', { blur: 0.5, opacity: 0.9 })

  // The coping: white tiles all round, ruled with grout. Their seams run away
  // from us through the vanishing point on the far and near sides, straight
  // across on the right.
  await c.svg(
    `<path d="M-20 ${far} L ${out(far)} ${far} L ${inner(water)} ${water} L -20 ${water} Z" fill="#fbfaf6"/>` +
      `<path d="M${out(far)} ${far} L ${out(nearOut)} ${nearOut} L ${inner(near)} ${near} L ${inner(water)} ${water} Z" fill="#f6f4ef"/>` +
      `<path d="M-20 ${near} L ${inner(near)} ${near} L ${out(nearOut)} ${nearOut} L -20 ${nearOut} Z" fill="#fdfcf9"/>`,
  )
  const eye = 1.6 // the eye's height over the deck, m
  const across = (y: number) => (y - vy) / eye // px per metre at the deck's height, at row y
  let grout = ''
  for (let X = -20; X < 3; X += 0.5) {
    const xa = vx + X * across(far)
    const xb = vx + X * across(water)
    if (xb < out(far)) grout += `<path d="M${xa} ${far} L ${xb} ${water}"/>`
    const xc = vx + X * across(near)
    const xd = vx + X * across(nearOut)
    if (xc < inner(near)) grout += `<path d="M${xc} ${near} L ${xd} ${nearOut}"/>`
  }
  for (let z = (f * eye) / (far - vy) - 0.5; z > (f * eye) / (near - vy); z -= 0.5) {
    const y = vy + (f * eye) / z
    grout += `<path d="M${inner(y)} ${y} L ${out(y)} ${y}"/>`
  }
  grout += `<path d="M${inner(near)} ${near} L ${out(near)} ${near}"/>`
  grout += `<path d="M-20 ${far} L ${out(far)} ${far} M -20 ${nearOut} L ${out(nearOut)} ${nearOut} M ${out(far)} ${far} L ${out(nearOut)} ${nearOut}"/>`
  await c.shape(`<g fill="none" stroke-width="2.6">${grout}</g>`, '#5b6472', { blur: 0.6, opacity: 0.85 })
  // The coping's lip throws a thin shadow on the water under it.
  await c.shape(`<path d="M-20 ${water} L ${inner(water)} ${water} L ${inner(near)} ${near} L ${inner(near) - 12} ${near} L ${inner(water) - 3} ${water + 5} L -20 ${water + 5} Z"/>`, '#0d6f9a', { blur: 1.5, opacity: 0.5 })
  c.stipple({ x: 0, y: far, w: W, h: nearOut - far }, { per: 0.004, dark: '#8d8a8a', light: '#ffffff', darkAlpha: 0.2, lightAlpha: 0.2, r: [0.5, 1.1] })

  // The diving board: a white plank on a chrome stand at the deep end,
  // reaching out over the water, seen side on.
  await c.svg(
    `<defs><linearGradient id="stand" x1="0" y1="0" x2="1" y2="0">${stops([
      [0, '#6b7590'],
      [0.4, '#ffffff'],
      [1, '#8a93a8'],
    ])}</linearGradient></defs>` +
      `<path d="M${board.stand - 22} ${board.y + 14} L ${board.stand + 26} ${board.y + 14} L ${board.stand + 34} ${H * 0.78} L ${board.stand - 30} ${H * 0.78} Z" fill="url(#stand)"/>` +
      `<path d="M${board.x0} ${board.y} L ${board.x1} ${board.y - 4} L ${board.x1} ${board.y + 6} L ${board.x0} ${board.y + 9} Z" fill="#ffffff"/>` +
      `<path d="M${board.x0} ${board.y + 9} L ${board.x1} ${board.y + 6} L ${board.x1} ${board.y + 15} L ${board.x0} ${board.y + 16} Z" fill="#c9d0de"/>`,
  )
  await c.shape(`<path d="M${board.stand - 30} ${H * 0.78} L ${board.stand + 34} ${H * 0.78} L ${board.stand + 4} ${H * 0.787} L ${board.stand - 70} ${H * 0.785} Z"/>`, '#a99aa8', { blur: 1, opacity: 0.7 })

  // The palm itself, dark against the white, its upper leaflets lit.
  await c.shape(p.trunk, '#3a3029', { blur: 1 })
  await c.shape(p.rings, '#1d1713', { blur: 0.8, opacity: 0.55 })
  await c.shape(p.back, '#0d3326', { blur: 1.1 })
  await c.shape(p.fronds, '#155537', { blur: 1 })
  await c.shape(p.leaflets, '#4aa865', { blur: 0.9 })
  const crown = await c.mask(p.back + p.fronds + p.leaflets, 1)
  c.dots(c.scatter(5000, c.sampler(crown), () => ({ r: c.between(0.6, 1.4), colour: c.pick(['#07170f', '#a3e08e']), alpha: c.between(0.3, 0.7) }), { x: W * 0.72, y: 0, w: W * 0.28, h: H * 0.45 }))
  // Its foot, and a short shadow on the deck.
  await c.shape(`<path d="M${tree.x - 12} ${tree.base} L ${tree.x - W * 0.06} ${tree.base - H * 0.012} L ${tree.x - W * 0.06} ${tree.base - H * 0.004} L ${tree.x + 12} ${tree.base + 2} Z"/>`, '#a99aa8', { blur: 1.4, opacity: 0.6 })

  // What twinkles: the brightest knots of the net, glints on the surface, the chrome.
  const twinkles: Twinkle[] = [
    ...caustic.filter((d) => netDensity(d.x, d.y) > 0.6 && c.chance(0.09)).map((d) => [d.x, d.y, d.r * 1.4, '#ffffff'] as const),
    ...surface.filter(() => c.chance(0.2)).map((g) => [g.x + g.w / 2, g.y, Math.max(1.2, g.w / 3), '#ffffff'] as const),
    ...rails.map((x) => [x - 2.5, H * 0.56, 2.4, '#ffffff'] as const),
  ].map(([x, y, r, colour]) => [x / W, y / H, r / W, colour] as Twinkle)

  return { motion: { twinkles }, noise: 13 }
}

