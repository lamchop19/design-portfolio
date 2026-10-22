import type { Painter } from '.'
import { Canvas, type Dot, type Hotspot, mix, type Rect, stops, type Twinkle } from './kit'

/**
 * Record store, after Nagai's record store at dusk: a sky running from violet
 * to hot pink over a skyline of towers whose windows are lit in yellow grids,
 * with the city's lights dotted between them; a dark band of trees; two very
 * tall fan palms in silhouette; and in front a row of five low shopfronts in
 * the site's flat colours, the middle one a lit record store with a pink neon
 * round its sign and its light pooling on the pavement. The sign panels are
 * left blank so the site can write over them (they come back as hotspots). At
 * night the sky goes navy with a moon, every shop window glows and a car's
 * lights cross the road.
 */

type Light = {
  sky: Array<[number, string]>
  /** The glow low over the city, and the haze the towers' feet stand in. */
  glow: string
  haze: string
  /** Towers: the far rank, then the back and front ranks as [lit face, shadow side]. */
  far: string
  back: [string, string]
  front: [string, string]
  windows: string[]
  /** How many of a tower's windows are lit, between these. */
  fill: [number, number]
  trees: [string, string]
  palm: { trunk: [string, string]; skirt: [string, string]; straw: string; back: string; crown: string; rim: string }
  /** What the shopfronts lean towards (the light they stand in) and how far; the sky's tint on their tops; how dark their feet go. */
  shade: [string, number]
  tint: string
  foot: [string, number]
  glass: Array<[number, string]>
  pavement: [string, string]
  joint: string
  curb: [string, string]
  road: string
  post: string
}

const DUSK: Light = {
  sky: [
    [0, '#3a2394'],
    [0.25, '#5a30ab'],
    [0.5, '#9a3fb4'],
    [0.7, '#d856ab'],
    [0.86, '#f474a6'],
    [1, '#ff9aa4'],
  ],
  glow: '#ff9fb4',
  haze: '#ff94b4',
  far: '#a14fae',
  back: ['#3c4895', '#2c3779'],
  front: ['#23306d', '#18235a'],
  windows: ['#ffe45c', '#ffd84f', '#fff1a6', '#ffe45c', '#ffc46b'],
  fill: [0.22, 0.6],
  trees: ['#13291f', '#2f5c47'],
  palm: { trunk: ['#3d3654', '#15172c'], skirt: ['#3b2c38', '#1b1521'], straw: '#5e4652', back: '#1c2042', crown: '#161933', rim: '#ffa47c' },
  shade: ['#6a3f8f', 0.08],
  tint: '#ffb8d6',
  foot: ['#16181d', 0.16],
  glass: [
    [0, '#2c2660'],
    [0.14, '#6a45ac'],
    [0.28, '#e486b8'],
    [0.36, '#f6a6c2'],
    [0.46, '#9a5fb4'],
    [0.7, '#3a3c8c'],
    [1, '#1a2257'],
  ],
  pavement: ['#e6aca7', '#cf919f'],
  joint: '#b07a8b',
  curb: ['#f5cdc5', '#9a6a84'],
  road: '#3a2a4c',
  post: '#22233f',
}

const NIGHT: Light = {
  sky: [
    [0, '#050922'],
    [0.4, '#0f164a'],
    [0.75, '#221f62'],
    [1, '#3d2a6c'],
  ],
  glow: '#6a3a8a',
  haze: '#3a2a70',
  far: '#1b1e54',
  back: ['#1a234f', '#121a40'],
  front: ['#0f1839', '#0a112c'],
  windows: ['#ffe45c', '#ffd84f', '#fff1a6', '#e9f1ff', '#ffe45c', '#ffc46b'],
  fill: [0.42, 0.82],
  trees: ['#06110d', '#15291f'],
  palm: { trunk: ['#1e1e36', '#07081a'], skirt: ['#1d1722', '#0c0a12'], straw: '#2e2432', back: '#0b0d2a', crown: '#07091a', rim: '#ffb46c' },
  shade: ['#1a1d52', 0.4],
  tint: '#6a64b8',
  foot: ['#07081c', 0.5],
  glass: [
    [0, '#2a2a6a'],
    [1, '#0b1030'],
  ],
  pavement: ['#5f4862', '#40304a'],
  joint: '#4b3a54',
  curb: ['#7d6280', '#2e2238'],
  road: '#17111f',
  post: '#0e0f24',
}

type Box = { x: number; y: number; w: number; h: number }
type Inside = 'cafe' | 'boutique' | 'records' | 'florist' | 'laundry'

/**
 * The shopfronts, left to right: id (what the site writes on the sign), share
 * of the row, facade and trim, how high the parapet stands, what's inside, an
 * awning's stripes, and whether the door is on the left.
 */
const SHOPS: Array<{ id: string; share: number; facade: string; trim: string; top: number; inside: Inside; awning?: [string, string]; doorLeft?: boolean }> = [
  { id: 'about', share: 0.19, facade: '#78c98c', trim: '#3f9762', top: 0.7, inside: 'cafe', awning: ['#f7efe3', '#f551ab'] },
  { id: 'experience', share: 0.2, facade: '#2361ea', trim: '#1444b4', top: 0.693, inside: 'boutique', doorLeft: true },
  { id: 'work', share: 0.22, facade: '#f0e7db', trim: '#f08ec0', top: 0.686, inside: 'records' },
  { id: 'scraps', share: 0.2, facade: '#f2733f', trim: '#c9532a', top: 0.697, inside: 'florist', awning: ['#f7efe3', '#0059ff'] },
  { id: 'contact', share: 0.19, facade: '#f05aa8', trim: '#c43e85', top: 0.702, inside: 'laundry', doorLeft: true },
]

/** The light inside each kind of shop: [top, bottom] of the window. */
const INSIDE_LIGHT: Record<Inside, [string, string]> = {
  cafe: ['#fff0bf', '#ffb867'],
  boutique: ['#fff8ea', '#ffd9a6'],
  records: ['#fff3c4', '#ffb15e'],
  florist: ['#fff6d2', '#ffcf86'],
  laundry: ['#f4fbef', '#c9ecd9'],
}

/** Record sleeves and garments: the brand's inks, a few riso colours, paper and ink. */
const SLEEVES = ['#0059ff', '#f551ab', '#81db89', '#ff6c3a', '#ffe14d', '#16181d', '#ecebe5', '#3a5ba0', '#c9a8ff']

const f = (n: number) => n.toFixed(1)

export const recordStore: Painter = async (c, variant) => {
  const { W, H } = c
  const night = variant === 'night'
  const L = night ? NIGHT : DUSK
  const skyline = H * 0.68 // where the towers stand, behind the trees
  const base = H * 0.925 // the shopfronts' step onto the pavement
  const curb = H * 0.968 // the kerb, and the road beyond it

  // Sky: violet overhead to hot pink at the skyline (navy at night).
  await c.svg(`<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">${stops(L.sky)}</linearGradient></defs><rect width="${W}" height="${f(skyline + 4)}" fill="url(#sky)"/>`)
  c.stipple({ x: 0, y: 0, w: W, h: skyline }, { per: 0.006, dark: night ? '#02040f' : '#2a1468', light: night ? '#8d86ff' : '#ffd0ea', darkAlpha: 0.3, lightAlpha: 0.18, r: [0.6, 1.4] })
  let stars: Dot[] = []
  if (night) {
    // Stars, thickest overhead, and a full moon in a halo.
    stars = c.scatter(320, (_, y) => 1 - y / (H * 0.5), () => ({ r: c.between(0.7, 1.8), colour: c.pick(['#f2efff', '#f2efff', '#fff3c4', '#cfe0ff']), alpha: c.between(0.4, 0.95) }), { x: 0, y: 0, w: W, h: H * 0.5 })
    c.dots(stars)
    const moon = { x: W * 0.875, y: H * 0.15, r: H * 0.03 }
    await c.svg(`<defs><radialGradient id="halo"><stop offset="0" stop-color="#9a92ee" stop-opacity="0.5"/><stop offset="0.35" stop-color="#7f78d8" stop-opacity="0.2"/><stop offset="1" stop-color="#6a64c8" stop-opacity="0"/></radialGradient></defs><circle cx="${f(moon.x)}" cy="${f(moon.y)}" r="${f(moon.r * 5)}" fill="url(#halo)"/>`)
    await c.svg(
      `<defs><radialGradient id="moon" cx="0.4" cy="0.38" r="0.75">${stops([
        [0, '#fffdf0'],
        [0.65, '#f6eccc'],
        [1, '#e0d0b0'],
      ])}</radialGradient></defs><circle cx="${f(moon.x)}" cy="${f(moon.y)}" r="${f(moon.r)}" fill="url(#moon)"/>`,
      { blur: 0.7 },
    )
    c.dots(
      Array.from({ length: 40 }, () => {
        const a = c.random() * Math.PI * 2
        const d = Math.sqrt(c.random()) * moon.r * 0.8
        return { x: moon.x + Math.cos(a) * d, y: moon.y + Math.sin(a) * d, r: c.between(1, 3.5), colour: '#d9cba6', alpha: c.between(0.25, 0.5) }
      }),
    )
  } else {
    // Long streaks of cloud: lilac up high; lower down, lit pink from under
    // the horizon, their undersides catching the last of it in peach.
    type Streak = { x: number; y: number; rx: number; ry: number }
    const streaks = (count: number, band: [number, number]) => {
      const out: Streak[] = []
      for (let i = 0; i < count; i++) {
        const cx = c.between(-0.1, 1.1) * W
        const cy = c.between(band[0], band[1]) * H
        const len = c.between(200, 560)
        for (let k = 0; k < 5; k++) out.push({ x: cx + c.between(-0.5, 0.5) * len, y: cy + c.between(-5, 5), rx: len * c.between(0.25, 0.55), ry: c.between(5, 13) })
      }
      return out
    }
    const svgOf = (list: Streak[], dy = 0, thin = 1) => list.map((e) => `<ellipse cx="${f(e.x)}" cy="${f(e.y + dy)}" rx="${f(e.rx * thin)}" ry="${f(e.ry * thin)}"/>`).join('')
    const high = streaks(6, [0.1, 0.26])
    const low = streaks(9, [0.3, 0.52])
    await c.soft(svgOf(high), '#a97ddb', 5, 0.42)
    await c.soft(svgOf(low), '#ffa6c8', 4, 0.62)
    await c.soft(svgOf(low, 5, 0.6), '#ffd3b2', 3, 0.5)
    const clouds = c.sampler(await c.mask(svgOf([...high, ...low]), 4))
    c.dots(c.scatter(1800, clouds, () => ({ r: c.between(0.6, 1.2), colour: c.pick(['#ffd6ea', '#ffe8f2', '#8a5ac4']), alpha: c.between(0.15, 0.35) }), { x: 0, y: H * 0.05, w: W, h: H * 0.5 }))
  }
  // The city's glow low in the sky.
  await c.soft(`<rect x="-100" y="${f(H * 0.46)}" width="${W + 200}" height="${f(H * 0.22)}"/>`, L.glow, 46, night ? 0.32 : 0.3)

  // The skyline: a hazy far rank of low blocks, a back rank of tall towers,
  // the haze of the city between, then a darker front rank. Each tower has a
  // lit face and a shadow side, some a setback or a mast with a red lamp.
  type Tower = { x: number; w: number; top: number; side: number; set?: { w: number; h: number }; mast?: number }
  const rank = (count: number, tall: [number, number], widths: [number, number], extras: boolean) => {
    const list: Tower[] = []
    for (let i = 0; i < count; i++) {
      const w = c.between(widths[0], widths[1])
      const x = ((i + c.between(-0.35, 0.35)) / count) * (W + 160) - 80 - w / 2
      // Taller towards the middle, as a downtown is.
      const middle = 1 - Math.min(1, Math.abs(x + w / 2 - W * 0.55) / (W * 0.55))
      const t: Tower = { x, w, top: skyline - H * c.between(tall[0], tall[1]) * (0.65 + 0.55 * middle), side: w * c.between(0.18, 0.3) }
      if (extras && c.chance(0.35)) t.set = { w: w * c.between(0.5, 0.72), h: H * c.between(0.025, 0.06) }
      if (extras && c.chance(0.22)) t.mast = c.between(24, 64)
      list.push(t)
    }
    return list
  }
  const roofOf = (t: Tower) => t.top - (t.set?.h ?? 0)
  const towerSvg = (list: Tower[], [face, side]: [string, string]) =>
    list
      .map((t) => {
        let s = `<rect x="${f(t.x)}" y="${f(t.top)}" width="${f(t.w)}" height="${f(skyline - t.top + 4)}" fill="${face}"/><rect x="${f(t.x + t.w - t.side)}" y="${f(t.top)}" width="${f(t.side)}" height="${f(skyline - t.top + 4)}" fill="${side}"/>`
        if (t.set) {
          const sx = t.x + (t.w - t.set.w) / 2
          s += `<rect x="${f(sx)}" y="${f(roofOf(t))}" width="${f(t.set.w)}" height="${f(t.set.h + 1)}" fill="${face}"/><rect x="${f(sx + t.set.w * 0.74)}" y="${f(roofOf(t))}" width="${f(t.set.w * 0.26)}" height="${f(t.set.h + 1)}" fill="${side}"/>`
        }
        if (t.mast) s += `<rect x="${f(t.x + t.w * 0.5 - 1.5)}" y="${f(roofOf(t) - t.mast)}" width="3" height="${f(t.mast + 1)}" fill="${side}"/>`
        return s
      })
      .join('')
  const faces = (list: Tower[]) =>
    list.flatMap((t) => {
      const boxes = [{ x: t.x, w: t.w - t.side, top: t.top, bottom: skyline }]
      if (t.set) boxes.push({ x: t.x + (t.w - t.set.w) / 2, w: t.set.w * 0.74, top: roofOf(t), bottom: t.top })
      return boxes
    })

  const far = rank(26, [0.06, 0.15], [60, 150], false)
  await c.svg(towerSvg(far, [L.far, mix(L.far, '#000000', 0.12)]), { blur: 1.4 })
  c.rects(towerWindows(c, faces(far), L, 0.35, [8, 10]))
  await c.soft(`<rect x="-100" y="${f(skyline - H * 0.1)}" width="${W + 200}" height="${f(H * 0.12)}"/>`, L.haze, 26, 0.3)

  const back = rank(16, [0.18, 0.36], [90, 200], true)
  await c.svg(towerSvg(back, L.back), { blur: 0.6 })
  const windowsBack = towerWindows(c, faces(back), L, 0.85, [9, 13])
  c.rects(windowsBack)
  // The lights of the lower city between the towers, and its haze.
  await c.soft(`<rect x="-100" y="${f(skyline - H * 0.07)}" width="${W + 200}" height="${f(H * 0.09)}"/>`, L.haze, 22, 0.22)
  const cityLights = c.scatter(
    1700,
    (_, y) => Math.pow(Math.max(0, (y - H * 0.5) / (skyline - H * 0.5)), 1.6),
    () => ({ r: c.between(1.1, 3), colour: c.pick(['#ffffff', '#cfe6ff', '#9fd0ff', '#ffe08a', '#ffe08a', '#ff6b6b']), alpha: c.between(0.55, 1) }),
    { x: 0, y: H * 0.5, w: W, h: skyline - H * 0.5 },
  )
  c.dots(cityLights)

  const front = rank(20, [0.08, 0.22], [80, 180], true)
  await c.svg(towerSvg(front, L.front), { blur: 0.6 })
  const windowsFront = towerWindows(c, faces(front), L, 1, [9, 13])
  c.rects(windowsFront)
  // Red lamps on the masts and the tallest roofs.
  const tips: Dot[] = [...back, ...front]
    .filter((t) => t.mast || (t.top < skyline - H * 0.2 && c.chance(0.4)))
    .map((t) => ({ x: t.x + t.w * 0.5, y: roofOf(t) - (t.mast ?? 0) - 3, r: 3, colour: '#ff4d4d', alpha: 1 }))
  c.dots(tips)

  // Fan palms in silhouette: two very tall ones and a few far off, rising
  // from behind the trees; an airbrushed haze behind each crown, and a warm
  // rim along the fronds' undersides where the shops' light reaches them.
  const palms = [
    ...[
      [0.07, 0.47],
      [0.1, 0.505],
      [0.43, 0.465],
      [0.555, 0.5],
      [0.885, 0.445],
    ].map(([x, top]) => fanPalm(c, { x: W * x, base: H * 0.7, top: H * top, width: 7, crown: W * 0.0145 })),
    fanPalm(c, { x: W * 0.255, base: H * 0.74, top: H * 0.125, width: 14, crown: W * 0.042 }),
    fanPalm(c, { x: W * 0.712, base: H * 0.74, top: H * 0.095, width: 15, crown: W * 0.046 }),
  ]
  const across = (id: string, [a, b]: [string, string]) => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">${stops([
    [0, a],
    [1, b],
  ])}</linearGradient>`
  const fronds = palms.map((p) => p.fronds).join('')
  await c.soft(palms.map((p) => p.halo).join(''), L.palm.crown, 14, 0.3)
  await c.svg(`<defs>${across('trunk', L.palm.trunk)}</defs><g fill="url(#trunk)">${palms.map((p) => p.trunk).join('')}</g>`, { blur: 0.7 })
  await c.svg(`<defs>${across('skirt', L.palm.skirt)}</defs><g fill="url(#skirt)">${palms.map((p) => p.skirt).join('')}</g>`, { blur: 0.8 })
  await c.shape(palms.map((p) => p.strands).join(''), L.palm.straw, { blur: 0.6, opacity: 0.6 })
  await c.shape(palms.map((p) => p.back).join(''), L.palm.back, { blur: 0.9 })
  await c.soft(fronds, L.palm.crown, 5, 0.5)
  // The rims: the blades again, a few pixels lower in the shops' warm light, so
  // only the undersides of the lower fronds show it; at night the moon catches
  // their upper right edges too.
  await c.shape(`<g transform="translate(0 2.6)">${palms.map((p) => p.lower).join('')}</g>`, L.palm.rim, { blur: 1, opacity: night ? 0.32 : 0.6 })
  if (night) await c.shape(`<g transform="translate(2.2 -2.2)">${palms.map((p) => p.blades).join('')}</g>`, '#9a96e8', { blur: 1, opacity: 0.35 })
  await c.shape(fronds, L.palm.crown, { blur: 0.8 })
  const crowns = c.sampler(await c.mask(fronds, 1))
  for (const p of palms) c.dots(c.scatter((p.box.w * p.box.h) / 300, crowns, () => ({ r: c.between(0.6, 1.1), colour: L.palm.back, alpha: c.between(0.2, 0.4) }), p.box))

  // The trees: a dark band of rounded canopies, a few taller, rims caught by the sky.
  const canopies: Array<{ x: number; y: number; r: number }> = []
  for (let x = -60; x < W + 60; x += c.between(36, 84)) canopies.push({ x, y: H * c.between(0.63, 0.668), r: c.between(32, 88) })
  for (const x of [0.04, 0.33, 0.52, 0.8, 0.95]) canopies.push({ x: W * (x + c.between(-0.02, 0.02)), y: H * c.between(0.615, 0.635), r: c.between(70, 100) })
  const treeShape = canopies.map((t) => `<circle cx="${f(t.x)}" cy="${f(t.y)}" r="${f(t.r)}"/>`).join('') + `<rect x="-60" y="${f(H * 0.655)}" width="${W + 120}" height="${f(H * 0.1)}"/>`
  await c.shape(treeShape, L.trees[0], { blur: 1.4 })
  const trees = c.sampler(await c.mask(treeShape, 1))
  const rim = (x: number, y: number) => {
    let best = 0
    for (const t of canopies) {
      const d = Math.hypot(x - t.x, y - t.y)
      if (d < t.r && y < t.y) best = Math.max(best, Math.max(0, (d / t.r - 0.55) * 2) * ((t.y - y) / t.r))
    }
    return best
  }
  c.dots(c.scatter(9000, (x, y) => trees(x, y) * rim(x, y), () => ({ r: c.between(0.8, 2), colour: c.pick([L.trees[1], mix(L.trees[1], night ? '#6a4a9a' : '#e889b8', 0.3)]), alpha: c.between(0.4, 0.85) }), { x: 0, y: H * 0.5, w: W, h: H * 0.18 }))

  // The shopfronts: a facade lit from the sky and falling off to its foot,
  // pilasters and a cornice, a blank sign, a window and a door each; the
  // record store in the middle stands a step taller.
  const pil = 12
  const cornice = H * 0.022
  let cursor = 0
  const shops = SHOPS.map((s) => {
    const x = cursor
    const w = s.share * W
    const top = H * s.top
    cursor += w
    const sign = { x: x + w * 0.12, y: top + H * 0.034, w: w * 0.76, h: H * 0.058 }
    const winW = w * 0.58
    const doorW = w * 0.16
    const winX = s.doorLeft ? x + w - pil - w * 0.05 - winW : x + pil + w * 0.05
    const doorX = s.doorLeft ? x + pil + w * 0.06 : x + w - pil - w * 0.06 - doorW
    const win = { x: winX, y: top + H * 0.11, w: winW, h: base - H * 0.04 - (top + H * 0.11) }
    const door = { x: doorX, y: top + H * 0.1, w: doorW, h: base - 8 - (top + H * 0.1) }
    return { ...s, x, w, top, face: mix(s.facade, L.shade[0], L.shade[1]), trimC: mix(s.trim, L.shade[0], L.shade[1] * 0.8), sign, win, door, lit: night || s.id === 'work' }
  })
  const store = shops.find((s) => s.id === 'work')!
  const hotspots: Hotspot[] = shops.map((s) => ({ id: s.id, x: (s.sign.x + 5) / W, y: (s.sign.y + 5) / H, w: (s.sign.w - 10) / W, h: (s.sign.h - 10) / H }))

  let fronts = '<defs>'
  shops.forEach((s, i) => {
    fronts += `<linearGradient id="face${i}" x1="0" y1="0" x2="0" y2="1">${stops([
      [0, mix(s.face, L.tint, night ? 0.12 : 0.2)],
      [0.4, s.face],
      [1, mix(s.face, L.foot[0], L.foot[1])],
    ])}</linearGradient>`
  })
  fronts += '</defs>'
  shops.forEach((s, i) => {
    const { x, w, top, trimC: trim, sign, win, door } = s
    fronts += `<rect x="${f(x)}" y="${f(top)}" width="${f(w + 1)}" height="${f(base - top)}" fill="url(#face${i})"/>`
    if (s.id === 'work') {
      // A raised parapet, stepping up to the middle.
      for (const [share, rise] of [
        [0.62, H * 0.014],
        [0.4, H * 0.03],
      ]) {
        fronts += `<rect x="${f(x + (w * (1 - share)) / 2)}" y="${f(top - rise)}" width="${f(w * share)}" height="${f(rise + 2)}" fill="${trim}"/><rect x="${f(x + (w * (1 - share)) / 2)}" y="${f(top - rise)}" width="${f(w * share)}" height="3" fill="${mix(trim, '#ffffff', 0.3)}"/>`
      }
    }
    // Pilasters at either side, and the cornice with its lit edge.
    fronts += `<rect x="${f(x)}" y="${f(top)}" width="${pil}" height="${f(base - top)}" fill="${trim}"/><rect x="${f(x + w - pil)}" y="${f(top)}" width="${pil + 1}" height="${f(base - top)}" fill="${trim}"/><rect x="${f(x + w - 1.5)}" y="${f(top)}" width="3" height="${f(base - top)}" fill="#16181d" opacity="0.35"/>`
    fronts += `<rect x="${f(x)}" y="${f(top)}" width="${f(w + 1)}" height="${f(cornice)}" fill="${trim}"/><rect x="${f(x)}" y="${f(top)}" width="${f(w + 1)}" height="3" fill="${mix(trim, '#ffffff', 0.3)}"/>`
    // The sign's frame, the window's frame, sill and kickplate, the door's frame, the step.
    fronts += `<rect x="${f(sign.x)}" y="${f(sign.y)}" width="${f(sign.w)}" height="${f(sign.h)}" fill="${trim}"/>`
    fronts += `<rect x="${f(win.x - 7)}" y="${f(win.y - 7)}" width="${f(win.w + 14)}" height="${f(win.h + 14)}" fill="${trim}"/>`
    fronts += `<rect x="${f(win.x - 12)}" y="${f(win.y + win.h + 7)}" width="${f(win.w + 24)}" height="6" fill="${mix(trim, '#ffffff', 0.25)}"/>`
    fronts += `<rect x="${f(win.x)}" y="${f(win.y + win.h + 13)}" width="${f(win.w)}" height="${f(base - 8 - (win.y + win.h + 13))}" fill="${mix(trim, '#16181d', 0.12)}"/>`
    fronts += `<rect x="${f(door.x - 6)}" y="${f(door.y - 6)}" width="${f(door.w + 12)}" height="${f(door.h + 6)}" fill="${trim}"/>`
    fronts += `<rect x="${f(x)}" y="${f(base - 8)}" width="${f(w + 1)}" height="8" fill="${mix(trim, '#16181d', 0.35)}"/>`
  })
  await c.svg(fronts)
  // Soft shadow under each cornice and sign; light from the lit windows and doors washing the facades.
  await c.soft(shops.map((s) => `<rect x="${f(s.x + pil)}" y="${f(s.top + cornice)}" width="${f(s.w - 2 * pil)}" height="12"/><rect x="${f(s.sign.x)}" y="${f(s.sign.y + s.sign.h)}" width="${f(s.sign.w)}" height="6"/>`).join(''), '#16181d', 6, 0.42)
  const litShops = shops.filter((s) => s.lit)
  await c.soft(litShops.map((s) => `<rect x="${f(s.win.x - 10)}" y="${f(s.win.y - 10)}" width="${f(s.win.w + 20)}" height="${f(s.win.h + 20)}"/><rect x="${f(s.door.x)}" y="${f(s.door.y)}" width="${f(s.door.w)}" height="${f(s.door.h)}"/>`).join(''), '#ffcf7a', 26, night ? 0.36 : 0.42)
  if (night) await c.soft(shops.map((s) => `<rect x="${f(s.sign.x - 6)}" y="${f(s.sign.y - 6)}" width="${f(s.sign.w + 12)}" height="${f(s.sign.h + 12)}"/>`).join(''), '#ffe9b0', 14, 0.45)

  // Glass: full of the sky where the shop is shut, a band of pink across it
  // at dusk; lit from inside where it's open.
  let glass = `<defs><linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">${stops(L.glass)}</linearGradient>`
  for (const [kind, [a, b]] of Object.entries(INSIDE_LIGHT)) {
    glass += `<linearGradient id="in-${kind}" x1="0" y1="0" x2="0" y2="1">${stops([
      [0, a],
      [1, b],
    ])}</linearGradient>`
  }
  glass += '</defs>'
  for (const s of shops) {
    const fill = s.lit ? `url(#in-${s.inside})` : 'url(#glass)'
    const { win, door } = s
    glass += `<rect x="${f(win.x)}" y="${f(win.y)}" width="${f(win.w)}" height="${f(win.h)}" fill="${fill}"/>`
    glass += `<rect x="${f(door.x)}" y="${f(door.y)}" width="${f(door.w)}" height="${f(door.h)}" fill="${mix(s.trimC, '#16181d', 0.3)}"/>`
    glass += `<rect x="${f(door.x + door.w * 0.14)}" y="${f(door.y + door.h * 0.07)}" width="${f(door.w * 0.72)}" height="${f(door.h * 0.58)}" fill="${fill}"/>`
  }
  await c.svg(glass)
  // What's inside the lit windows.
  const inside = { under: [] as Dot[], rects: [] as Rect[], dots: [] as Dot[] }
  for (const s of litShops) {
    const got = interior(c, s.inside, s.win)
    inside.under.push(...got.under)
    inside.rects.push(...got.rects)
    inside.dots.push(...got.dots)
  }
  c.dots(inside.under)
  c.rects(inside.rects)
  c.dots(inside.dots)

  // Over the glass: shade under the lintel, the sky's band and streaks of
  // reflection, mullions, awnings, door handles; then the signs' blank panels.
  let over = `<defs><linearGradient id="lintel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0820" stop-opacity="0.45"/><stop offset="1" stop-color="#0a0820" stop-opacity="0"/></linearGradient><linearGradient id="band" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6a6c2" stop-opacity="0"/><stop offset="0.5" stop-color="#f6a6c2" stop-opacity="0.38"/><stop offset="1" stop-color="#f6a6c2" stop-opacity="0"/></linearGradient><linearGradient id="slope" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.18"/><stop offset="1" stop-color="#16181d" stop-opacity="0.22"/></linearGradient></defs>`
  for (const s of shops) {
    const { win, door } = s
    if (s.lit && !night) over += `<rect x="${f(win.x)}" y="${f(win.y + win.h * 0.14)}" width="${f(win.w)}" height="${f(win.h * 0.3)}" fill="url(#band)"/>`
    over += `<rect x="${f(win.x)}" y="${f(win.y)}" width="${f(win.w)}" height="${f(win.h * (s.awning ? 0.5 : 0.24))}" fill="url(#lintel)"/>`
    const sheen = s.lit ? 0.12 : 0.24
    over += `<path d="M${f(win.x + win.w * 0.14)} ${f(win.y)} L ${f(win.x + win.w * 0.3)} ${f(win.y)} L ${f(win.x + win.w * 0.12)} ${f(win.y + win.h)} L ${f(win.x)} ${f(win.y + win.h)} L ${f(win.x)} ${f(win.y + win.h * 0.55)} Z" fill="#f1e6ff" opacity="${sheen}"/>`
    over += `<path d="M${f(win.x + win.w * 0.42)} ${f(win.y)} L ${f(win.x + win.w * 0.48)} ${f(win.y)} L ${f(win.x + win.w * 0.3)} ${f(win.y + win.h)} L ${f(win.x + win.w * 0.24)} ${f(win.y + win.h)} Z" fill="#f1e6ff" opacity="${sheen * 0.7}"/>`
    over += `<rect x="${f(win.x + win.w / 2 - 2.5)}" y="${f(win.y)}" width="5" height="${f(win.h)}" fill="${s.trimC}"/>`
    over += `<rect x="${f(door.x + (s.doorLeft ? door.w * 0.78 : door.w * 0.1))}" y="${f(door.y + door.h * 0.56)}" width="${f(door.w * 0.12)}" height="5" fill="${s.lit ? '#9a6a3a' : '#c9cbe0'}"/>`
    if (s.awning) over += awning(s.win, s.awning, s.trimC)
  }
  const panel = night ? '#fff5da' : '#f7efe2'
  over += shops.map((s) => `<rect x="${f(s.sign.x + 5)}" y="${f(s.sign.y + 5)}" width="${f(s.sign.w - 10)}" height="${f(s.sign.h - 10)}" fill="${panel}"/>`).join('')
  await c.svg(over)

  // Neon: a tube in the brand pink round the record store's sign, its glow on the facade.
  const neon = { x: store.sign.x - 9, y: store.sign.y - 8, w: store.sign.w + 18, h: store.sign.h + 16 }
  const tube = (width: number) => `<rect x="${f(neon.x)}" y="${f(neon.y)}" width="${f(neon.w)}" height="${f(neon.h)}" rx="11" fill="none" stroke-width="${width}"/>`
  await c.soft(tube(16), '#f551ab', 30, night ? 0.6 : 0.5)
  await c.soft(tube(9), '#ff5fb8', 9, 0.95)
  await c.shape(tube(6.5), '#ff6fc2', { blur: 0.8 })
  await c.shape(tube(2.6), '#fff0f8', { blur: 0.5 })

  // The florist's buckets out on the pavement, and a bay tree in a pot by the café's door.
  const outside = outdoors(c, shops.find((s) => s.inside === 'florist')!, shops.find((s) => s.inside === 'cafe')!, base, night)
  c.rects(outside.rects)
  c.dots(outside.dots)
  c.stipple({ x: 0, y: H * 0.66, w: W, h: base - H * 0.66 }, { per: 0.008, dark: '#2a1a3a', light: '#ffffff', darkAlpha: 0.18, lightAlpha: 0.12, r: [0.6, 1.3] })

  // The pavement: pink concrete in slabs, the joints running towards us in
  // perspective; the kerb, and a strip of road.
  await c.svg(
    `<defs><linearGradient id="pave" x1="0" y1="0" x2="0" y2="1">${stops([
      [0, L.pavement[0]],
      [1, L.pavement[1]],
    ])}</linearGradient></defs><rect y="${f(base)}" width="${W}" height="${f(curb - base + 1)}" fill="url(#pave)"/><rect y="${f(curb)}" width="${W}" height="7" fill="${L.curb[0]}"/><rect y="${f(curb + 7)}" width="${W}" height="11" fill="${L.curb[1]}"/><rect y="${f(curb + 18)}" width="${W}" height="${f(H - curb - 18)}" fill="${L.road}"/>`,
  )
  const eye = H * 0.86
  const spread = (curb - eye) / (base - eye)
  let joints = ''
  for (let xb = -W * 0.2; xb < W * 1.2; xb += 168) joints += `<path d="M${f(xb)} ${f(base)} L ${f(W / 2 + (xb - W / 2) * spread)} ${f(curb)}" fill="none" stroke-width="2.5"/>`
  joints += `<rect x="0" y="${f(base + (curb - base) * 0.4)}" width="${W}" height="2.5"/>`
  await c.shape(joints, L.joint, { blur: 0.8, opacity: 0.6 })
  c.stipple({ x: 0, y: base, w: W, h: H - base }, { per: 0.012, dark: '#2a1a2e', light: '#ffffff', darkAlpha: 0.28, lightAlpha: 0.18, r: [0.6, 1.5] })

  // Lamp posts at the kerb between the shops, globes lit.
  const lamps = [shops[1].x, shops[4].x].map((x) => ({ x, y: H * 0.622 }))
  await c.soft(lamps.map((l) => `<ellipse cx="${f(l.x)}" cy="${f(curb - 6)}" rx="150" ry="22"/>`).join(''), '#ffd890', 18, night ? 0.4 : 0.3)
  await c.svg(lamps.map((l) => lampPost(l.x, l.y, curb, L.post)).join(''))
  await c.soft(lamps.map((l) => `<circle cx="${f(l.x)}" cy="${f(l.y)}" r="26"/>`).join(''), '#ffe2a0', 22, 0.7)
  c.dots(lamps.map((l) => ({ x: l.x, y: l.y, r: 9, colour: '#fffbea', alpha: 0.9 })))

  // Light pooling on the slabs under each lit window and door: a soft
  // gradient fading out towards the road, a sparse few glints in it.
  const pool = (b: Box) => `<path d="M${f(b.x - 8)} ${f(base)} L ${f(b.x + b.w + 8)} ${f(base)} L ${f(b.x + b.w * 1.22 + 10)} ${f(curb + 10)} L ${f(b.x - b.w * 0.22 - 10)} ${f(curb + 10)} Z"/>`
  const pools = litShops.flatMap((s) => [s.win, s.door])
  await c.svg(
    `<defs><linearGradient id="pool" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe2a0" stop-opacity="0.8"/><stop offset="0.55" stop-color="#ffcf80" stop-opacity="0.32"/><stop offset="1" stop-color="#ffc874" stop-opacity="0"/></linearGradient></defs><g fill="url(#pool)">${pools.map(pool).join('')}</g>`,
    { blur: 16 },
  )
  const pooled = c.sampler(await c.mask(pools.map(pool).join(''), 12))
  c.dots(c.scatter(night ? 320 : 160, (x, y) => pooled(x, y) * Math.pow(1 - (y - base) / (curb - base + 10), 2), () => ({ r: c.between(0.6, 1.2), colour: c.pick(['#fff4cf', '#ffe7a0']), alpha: c.between(0.25, 0.55) }), { x: 0, y: base, w: W, h: curb - base + 10 }))

  // At night a car's lights cross the road: its own layer.
  const layers: Record<string, Canvas> = {}
  const sprites = []
  if (night) {
    const car = new Canvas({ width: 640, height: 60 }, 'record-store-car')
    await paintCarLights(car)
    layers.car = car
    sprites.push({ file: 'car', x: 0.56, y: (curb + 4) / H, w: 640 / W, motion: 'fly' as const, speed: 5 })
  }

  const twinkles: Twinkle[] = [
    ...windowsFront.filter(() => c.chance(0.045)).map((r) => [r.x + r.w / 2, r.y + r.h / 2, Math.max(r.w, r.h) * 0.6, r.colour] as const),
    ...windowsBack.filter(() => c.chance(0.025)).map((r) => [r.x + r.w / 2, r.y + r.h / 2, Math.max(r.w, r.h) * 0.6, r.colour] as const),
    ...cityLights.filter(() => c.chance(0.05)).map((d) => [d.x, d.y, d.r, d.colour] as const),
    ...stars.filter(() => c.chance(0.15)).map((d) => [d.x, d.y, d.r, d.colour] as const),
    ...tips.map((d) => [d.x, d.y, d.r, d.colour] as const),
    // The neon's flicker, round the tube.
    ...Array.from({ length: 14 }, (_, k) => {
      const t = k / 14
      const edge = t < 0.5 ? [neon.x + neon.w * t * 2, neon.y] : [neon.x + neon.w * (t - 0.5) * 2, neon.y + neon.h]
      return [edge[0], edge[1], 5, '#ff8fd0'] as const
    }),
    ...lamps.map((l) => [l.x, l.y, 10, '#fff1c4'] as const),
  ].map(([x, y, r, colour]) => [x / W, y / H, r / W, colour] as Twinkle)

  return { motion: { twinkles, hotspots, ...(sprites.length ? { sprites } : {}) }, layers, noise: 14 }
}

/**
 * Windows lit in grids on each tower face: some by the cell, some in whole
 * columns, some in whole floors, the way an office block empties out.
 */
function towerWindows(c: Canvas, faces: Array<{ x: number; w: number; top: number; bottom: number }>, L: Light, strength: number, cell: [number, number]) {
  const out: Rect[] = []
  for (const t of faces) {
    const cellW = c.between(cell[0], cell[1])
    const cellH = cellW * c.between(1.1, 1.35)
    const fill = c.between(L.fill[0], L.fill[1])
    const pattern = c.pick(['cells', 'columns', 'floors'] as const)
    const tint = c.pick(L.windows)
    const columns = Math.floor((t.w - 10) / cellW)
    if (columns < 1) continue
    const pad = (t.w - columns * cellW) / 2
    const colOn = Array.from({ length: columns }, () => c.random() < fill + 0.15)
    for (let y = t.top + 8; y < t.bottom - 6; y += cellH) {
      const floorOn = c.random() < fill + 0.1
      for (let k = 0; k < columns; k++) {
        const on = pattern === 'cells' ? c.random() < fill : pattern === 'columns' ? colOn[k] && c.random() < 0.92 : floorOn && c.random() < 0.9
        if (!on) continue
        out.push({ x: t.x + pad + k * cellW + cellW * 0.2, y: y + cellH * 0.2, w: cellW * 0.6, h: cellH * 0.58, colour: c.chance(0.85) ? tint : c.pick(L.windows), alpha: c.between(0.7, 1) * strength })
      }
    }
  }
  return out
}

/**
 * A fan palm (Washingtonia), as in Nagai's Los Angeles: a thin trunk with a
 * slight bow; a starburst crown of 18 to 26 fronds, each a narrow wedge on
 * its stalk with a ragged, split tip, sagging as it leans from upright; and a
 * short skirt of dead fronds under the crown, narrower than it and tapering.
 * SVG per ink, the crown's outline for a haze behind it, and its box.
 */
function fanPalm(c: Canvas, { x, base, top, width, crown: R }: { x: number; base: number; top: number; width: number; crown: number }) {
  const tx = x + c.between(-0.2, 0.2) * R
  const bow = c.between(-0.3, 0.3) * R
  const mid = (base + top) / 2
  const trunk = `<path d="M${f(x - width / 2)} ${f(base)} Q ${f((x + tx) / 2 + bow - width * 0.4)} ${f(mid)} ${f(tx - width * 0.3)} ${f(top + R * 0.2)} L ${f(tx + width * 0.3)} ${f(top + R * 0.2)} Q ${f((x + tx) / 2 + bow + width * 0.4)} ${f(mid)} ${f(x + width / 2)} ${f(base)} Z"/>`

  // The skirt: short, under the crown, tapering to a ragged hem.
  const len = R * c.between(0.55, 0.75)
  const y0 = top + R * 0.06
  const half = (t: number) => R * (0.3 - 0.13 * t)
  const sideA: string[] = []
  const sideB: string[] = []
  for (let i = 0; i <= 5; i++) {
    const t = i / 5
    sideA.push(`${f(tx - half(t) + c.between(-1.5, 1.5))},${f(y0 + t * len)}`)
    sideB.unshift(`${f(tx + half(t) + c.between(-1.5, 1.5))},${f(y0 + t * len)}`)
  }
  const hem: string[] = []
  for (let k = 1; k < 8; k++) hem.push(`${f(tx - half(1) + (2 * half(1) * k) / 8)},${f(y0 + len + (k % 2 ? c.between(0.05, 0.14) : c.between(-0.03, 0.03)) * R)}`)
  const skirt = `<polygon points="${[...sideA, ...hem, ...sideB].join(' ')}"/>`
  let strands = ''
  for (let i = 0; i < 16; i++) {
    const sx = tx + c.between(-0.22, 0.22) * R
    const s0 = y0 + len * c.between(0.05, 0.3)
    const s1 = y0 + len * c.between(0.8, 1.08)
    strands += `<path d="M${f(sx)} ${f(s0)} L ${f(sx + c.between(-0.03, 0.03) * R)} ${f(s1)}" fill="none" stroke-width="${f(Math.max(0.8, R * c.between(0.01, 0.022)))}"/>`
  }

  // A frond: a stalk out from the crown, then a narrow wedge widening to a
  // ragged tip of fingers and splits, the whole curving down by its weight
  // (most when it stands out sideways).
  const frond = (a: number, scale: number, s0 = c.between(0.36, 0.46)) => {
    const length = R * c.between(0.85, 1.08) * scale
    const droop = 0.08 + 0.36 * Math.cos(a) ** 2 + 0.25 * Math.max(0, Math.sin(a))
    const axis = (t: number) => [tx + Math.cos(a) * t * length, top + Math.sin(a) * t * length + droop * t * t * length] as const
    const tangent = (t: number) => {
      const dx = Math.cos(a)
      const dy = Math.sin(a) + 2 * droop * t
      const m = Math.hypot(dx, dy)
      return [dx / m, dy / m] as const
    }
    const wide = length * c.between(0.1, 0.15)
    const sideA: string[] = []
    const sideB: string[] = []
    for (let i = 0; i <= 6; i++) {
      const t = s0 + ((1 - s0) * i) / 6
      const [px, py] = axis(t)
      const [ux, uy] = tangent(t)
      const h = wide * Math.pow((t - s0) / (1 - s0), 0.7)
      sideA.push(`${f(px - uy * h)},${f(py + ux * h)}`)
      sideB.unshift(`${f(px + uy * h)},${f(py - ux * h)}`)
    }
    // The tip: fingers reaching past the end and splits cutting back into it, hanging a little.
    const [ex, ey] = axis(1)
    const [ux, uy] = tangent(1)
    const K = R > 60 ? 12 : 6
    const tip: string[] = []
    for (let k = 1; k < K; k++) {
      const side = wide * (1 - (2 * k) / K)
      const reach = k % 2 ? length * c.between(0.04, 0.12) : -length * c.between(0.12, 0.26)
      tip.push(`${f(ex - uy * side + ux * reach)},${f(ey + ux * side + uy * reach + Math.abs(reach) * 0.5)}`)
    }
    const [sx, sy] = axis(s0)
    return { stalk: `<path d="M${f(tx)} ${f(top)} L ${f(sx)} ${f(sy)}" fill="none" stroke-width="${f(Math.max(1.3, R * 0.03))}"/>`, blade: `<polygon points="${[...sideA, ...tip, ...sideB].join(' ')}"/>` }
  }
  // Spread round the crown a little unevenly; those hanging down over the skirt are shorter.
  const count = Math.round(c.between(18, 26))
  let fronds = `<ellipse cx="${f(tx)}" cy="${f(top + R * 0.04)}" rx="${f(R * 0.2)}" ry="${f(R * 0.15)}"/>`
  let blades = ''
  let lower = ''
  for (let i = 0; i < count; i++) {
    const a = -Math.PI / 2 + ((i + c.between(-0.45, 0.45)) / count) * 2 * Math.PI
    const { stalk, blade } = frond(a, (1 - 0.3 * Math.max(0, Math.sin(a)) ** 2) * c.between(0.85, 1.05))
    fronds += stalk + blade
    blades += blade
    if (Math.sin(a) > -0.3) lower += blade
  }
  // Behind: the heart of the crown, and shorter fronds filling it out.
  let back = `<ellipse cx="${f(tx)}" cy="${f(top + R * 0.06)}" rx="${f(R * 0.34)}" ry="${f(R * 0.27)}"/>`
  for (let i = 0; i < 8; i++) {
    const { stalk, blade } = frond(c.between(-Math.PI, Math.PI), 0.75, 0.22)
    back += stalk + blade
  }
  const halo = `<circle cx="${f(tx)}" cy="${f(top + R * 0.15)}" r="${f(R * 0.8)}"/>`
  const box = { x: tx - R * 1.4, y: top - R * 1.2, w: R * 2.8, h: R * 2.6 }
  return { trunk, skirt, strands, back, fronds, blades, lower, halo, box }
}

/** A lamp post at the kerb with a round globe, as on an old commercial street. SVG. */
function lampPost(x: number, y: number, curb: number, colour: string) {
  return (
    `<rect x="${f(x - 9)}" y="${f(curb - 30)}" width="18" height="30" fill="${colour}"/>` +
    `<rect x="${f(x - 3.5)}" y="${f(y + 16)}" width="7" height="${f(curb - 30 - y - 16)}" fill="${colour}"/>` +
    `<rect x="${f(x - 7)}" y="${f(y + 13)}" width="14" height="6" fill="${colour}"/>` +
    `<circle cx="${f(x)}" cy="${f(y)}" r="15" fill="#fff2c6"/>` +
    `<rect x="${f(x - 5)}" y="${f(y - 21)}" width="10" height="7" fill="${colour}"/>`
  )
}

/** A striped awning over a window, sloping out towards us, with a scalloped valance. SVG. */
function awning(win: Box, [a, b]: [string, string], trim: string) {
  const x0 = win.x - 18
  const x1 = win.x + win.w + 18
  const y0 = win.y - 12
  const y1 = y0 + win.h * 0.3
  const out = 12
  const n = 10
  let s = `<rect x="${f(x0 - 4)}" y="${f(y0 - 5)}" width="${f(x1 - x0 + 8)}" height="6" fill="${mix(trim, '#16181d', 0.3)}"/>`
  for (let k = 0; k < n; k++) {
    const topA = x0 + ((x1 - x0) * k) / n
    const topB = x0 + ((x1 - x0) * (k + 1)) / n
    const botA = x0 - out + ((x1 - x0 + 2 * out) * k) / n
    const botB = x0 - out + ((x1 - x0 + 2 * out) * (k + 1)) / n
    const fill = k % 2 ? a : b
    s += `<path d="M${f(topA)} ${f(y0)} L ${f(topB + 0.5)} ${f(y0)} L ${f(botB + 0.5)} ${f(y1)} L ${f(botA)} ${f(y1)} Z" fill="${fill}"/>`
    s += `<rect x="${f(botA)}" y="${f(y1)}" width="${f(botB - botA + 0.5)}" height="11" fill="${fill}"/><circle cx="${f((botA + botB) / 2)}" cy="${f(y1 + 11)}" r="${f((botB - botA) / 2)}" fill="${fill}"/>`
  }
  s += `<path d="M${f(x0)} ${f(y0)} L ${f(x1)} ${f(y0)} L ${f(x1 + out)} ${f(y1)} L ${f(x0 - out)} ${f(y1)} Z" fill="url(#slope)"/>`
  return s
}

/** What's in a lit window: `under` goes down first (records half out of their sleeves), then `rects`, then `dots`. */
function interior(c: Canvas, kind: Inside, b: Box) {
  const under: Dot[] = []
  const rects: Rect[] = []
  const dots: Dot[] = []
  const right = b.x + b.w
  const bottom = b.y + b.h
  if (kind === 'records') {
    // Two shelves of sleeves facing out, records peeking from some.
    const size = Math.min(b.h * 0.34, 46)
    for (const row of [0.1, 0.54]) {
      const y = b.y + b.h * row
      rects.push({ x: b.x, y: y + size + 1, w: b.w, h: 5, colour: '#7a4e2c', alpha: 0.95 })
      for (let x = b.x + 10; x < right - size - 8; x += size + c.between(5, 11)) {
        const colour = c.pick(SLEEVES)
        if (c.chance(0.35)) under.push({ x: x + size * 0.85, y: y + size / 2, r: size * 0.44, colour: '#16181d', alpha: 1 })
        rects.push({ x, y, w: size, h: size, colour, alpha: 1 })
        const ink = c.pick(SLEEVES.filter((s) => s !== colour))
        const art = c.pick(['disc', 'band', 'block', 'none'] as const)
        if (art === 'disc') dots.push({ x: x + size / 2, y: y + size / 2, r: size * 0.28, colour: ink, alpha: 1 })
        if (art === 'band') rects.push({ x, y: y + size * 0.6, w: size, h: size * 0.18, colour: ink, alpha: 1 })
        if (art === 'block') rects.push({ x: x + size * 0.12, y: y + size * 0.12, w: size * 0.36, h: size * 0.36, colour: ink, alpha: 1 })
      }
    }
  } else if (kind === 'cafe') {
    // Pendant lamps over a counter, the coffee machine, cups, a plant at the end.
    const counter = b.y + b.h * 0.62
    rects.push({ x: b.x, y: counter, w: b.w, h: bottom - counter, colour: '#6a3f2a', alpha: 1 }, { x: b.x, y: counter, w: b.w, h: 5, colour: '#d99a62', alpha: 1 })
    rects.push({ x: b.x + b.w * 0.08, y: counter - 30, w: 34, h: 30, colour: '#c9ccd4', alpha: 1 }, { x: b.x + b.w * 0.08 + 6, y: counter - 24, w: 22, h: 6, colour: '#3a3a44', alpha: 1 })
    for (let k = 0; k < 4; k++) rects.push({ x: b.x + b.w * c.between(0.3, 0.7), y: counter - 9, w: 7, h: 9, colour: '#fbf6ec', alpha: 1 })
    for (const t of [0.24, 0.5, 0.76]) {
      const lx = b.x + b.w * t
      rects.push({ x: lx - 1, y: b.y, w: 2, h: b.h * 0.22, colour: '#3a2a22', alpha: 0.9 }, { x: lx - 13, y: b.y + b.h * 0.22, w: 26, h: 11, colour: '#2f7a52', alpha: 1 })
      dots.push({ x: lx, y: b.y + b.h * 0.22 + 14, r: 5, colour: '#fff7d6', alpha: 1 })
    }
    for (let k = 0; k < 40; k++) dots.push({ x: right - 30 + c.between(-16, 16), y: counter - c.between(4, 40), r: c.between(3, 6), colour: c.pick(['#2f7a3f', '#3f9a52', '#5fbf6a']), alpha: 1 })
  } else if (kind === 'boutique') {
    // A rail of clothes on hangers, a stack of folded shirts.
    const rail = b.y + b.h * 0.16
    rects.push({ x: b.x + 8, y: rail, w: b.w * 0.72, h: 3, colour: '#2a2a33', alpha: 0.95 })
    for (let x = b.x + 14; x < b.x + b.w * 0.72 - 14; x += c.between(18, 26)) {
      const gw = c.between(14, 22)
      rects.push({ x: x + gw / 2 - 1, y: rail - 4, w: 2, h: 8, colour: '#2a2a33', alpha: 1 }, { x, y: rail + 4, w: gw, h: b.h * c.between(0.36, 0.58), colour: c.pick(SLEEVES), alpha: 1 })
    }
    let y = bottom - 12
    for (let k = 0; k < 6; k++) {
      rects.push({ x: right - b.w * 0.2, y, w: b.w * 0.14, h: 10, colour: c.pick(SLEEVES), alpha: 1 })
      y -= 11
    }
  } else if (kind === 'florist') {
    // Buckets of flowers on a stepped stand, a basket hanging above.
    for (let x = b.x + 16; x < right - 30; x += c.between(34, 46)) {
      const by = b.y + b.h * (c.chance(0.5) ? 0.6 : 0.78)
      rects.push({ x, y: by, w: 26, h: 22, colour: '#5a6470', alpha: 1 })
      const bloom = c.pick(['#f551ab', '#ffb3cf', '#ffe27a', '#fff8ec', '#ff6c3a', '#c9a8ff'])
      for (let k = 0; k < 24; k++) dots.push({ x: x + 13 + c.between(-15, 15), y: by - c.between(2, 30), r: c.between(2, 4), colour: k < 7 ? '#3f8a4f' : bloom, alpha: 1 })
    }
    const hx = b.x + b.w * 0.3
    rects.push({ x: hx - 1, y: b.y, w: 2, h: b.h * 0.18, colour: '#3a2a22', alpha: 0.9 })
    for (let k = 0; k < 30; k++) dots.push({ x: hx + c.between(-18, 18), y: b.y + b.h * 0.2 + c.between(-6, 22), r: c.between(2.5, 5), colour: c.pick(['#2f7a3f', '#5fbf6a', '#f551ab']), alpha: 1 })
  } else {
    // A row of washing machines with round doors, a strip light over them.
    const s = Math.min(b.h * 0.48, 66)
    const y = bottom - s - 4
    for (let x = b.x + 12; x + s < right - 10; x += s + 9) {
      rects.push({ x, y, w: s, h: s, colour: '#f4f1ea', alpha: 1 }, { x, y, w: s, h: s * 0.16, colour: '#d6d1c4', alpha: 1 })
      dots.push({ x: x + s / 2, y: y + s * 0.58, r: s * 0.32, colour: '#9fb0d0', alpha: 1 }, { x: x + s / 2, y: y + s * 0.58, r: s * 0.24, colour: '#2c3f78', alpha: 1 }, { x: x + s * 0.43, y: y + s * 0.5, r: s * 0.06, colour: '#e8f0ff', alpha: 0.9 })
    }
    rects.push({ x: b.x + b.w * 0.15, y: b.y + 8, w: b.w * 0.7, h: 4, colour: '#ffffff', alpha: 0.95 })
  }
  // Keep everything inside the glass.
  const inBox = (d: { x: number; y: number }) => d.x > b.x && d.x < right && d.y > b.y && d.y < bottom
  return { under: under.filter(inBox), rects: rects.filter(inBox), dots: dots.filter(inBox) }
}

/** On the pavement: the florist's buckets either side of its window, a bay tree in a pot by the café's door. */
function outdoors(c: Canvas, florist: { win: Box }, cafe: { door: Box }, base: number, night: boolean) {
  const rects: Rect[] = []
  const dots: Dot[] = []
  const dim = (hex: string) => (night ? mix(hex, '#1a1d52', 0.35) : hex)
  for (const x of [florist.win.x + 8, florist.win.x + 48, florist.win.x + florist.win.w - 70, florist.win.x + florist.win.w - 30]) {
    rects.push({ x, y: base - 26, w: 28, h: 24, colour: dim('#6a7480'), alpha: 1 })
    const bloom = c.pick(['#f551ab', '#ffe27a', '#fff8ec', '#ff6c3a', '#ffb3cf'])
    for (let k = 0; k < 30; k++) dots.push({ x: x + 14 + c.between(-17, 17), y: base - 26 - c.between(0, 30), r: c.between(2.4, 4.4), colour: dim(k < 9 ? '#3f8a4f' : bloom), alpha: 1 })
  }
  const px = cafe.door.x + cafe.door.w + 34
  rects.push({ x: px - 15, y: base - 30, w: 30, h: 28, colour: dim('#c96a4a'), alpha: 1 }, { x: px - 2, y: base - 70, w: 4, h: 42, colour: dim('#5a3a2a'), alpha: 1 })
  for (let k = 0; k < 70; k++) {
    const a = c.random() * Math.PI * 2
    const d = Math.sqrt(c.random()) * 30
    dots.push({ x: px + Math.cos(a) * d, y: base - 92 + Math.sin(a) * d, r: c.between(3, 5.5), colour: dim(c.pick(['#2f7a3f', '#3f9a52', '#5fbf6a', '#1f5a32'])), alpha: 1 })
  }
  return { rects, dots }
}

/** A car's lights in a 640 × 60 box, driving left: headlamps' glow in front, red tail lamps trailing a streak behind. */
async function paintCarLights(p: Canvas) {
  // The streak of the tail lamps, fading out behind.
  await p.svg('<defs><linearGradient id="trail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff2a4a" stop-opacity="0.9"/><stop offset="1" stop-color="#ff2a4a" stop-opacity="0"/></linearGradient></defs><rect x="250" y="26" width="370" height="8" fill="url(#trail)"/>', { blur: 4 })
  // The car's dark body between its lights, barely there.
  await p.shape('<path d="M60 40 L 74 22 L 120 14 L 200 14 L 236 24 L 262 30 L 262 46 L 60 46 Z"/>', '#120e1c', { blur: 1.2, opacity: 0.85 })
  // Headlamps and their glow ahead, tail lamps.
  await p.soft('<ellipse cx="40" cy="34" rx="40" ry="12"/>', '#fff1c4', 8, 0.7)
  p.dots([
    { x: 64, y: 34, r: 4.5, colour: '#fffbe8' },
    { x: 256, y: 32, r: 4, colour: '#ff3048' },
  ])
}
