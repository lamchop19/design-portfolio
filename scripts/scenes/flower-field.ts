import type { Painter } from '.'
import { type Canvas, type Dot, halo, mix, stops, type Twinkle } from './kit'

/**
 * Flower field, after the flora and the wildflower paintings on Marc's board:
 * rolling hills layered into the distance under an airbrushed sky with soft
 * clouds, sprayed with flowers in the brand's inks as a pointillist field
 * (tiny and dense in bands on the far hills, opening into small flowers near
 * us), a path winding up to a glasshouse, a lone tree, and a front row of
 * full blossoms, cosmos and poppies, in the grass. At dusk the sky runs
 * violet to peach, the flowers glow, the glasshouse is lit and fireflies come
 * out.
 */

type Light = {
  sky: Array<[number, string]>
  /** Clouds: the shadowed body, the lit side and its brightest cores, the shade along the base, and which way the light falls on them. */
  clouds: { body: string; lit: string; core: string; base: string; light: [number, number] }
  /** What the distance fades into, and the haze band over the far hills. */
  haze: string
  mist: string
  range: [string, string]
  far: [string, string]
  mid: [string, string, string]
  near: [string, string, string]
  /** The lit rim along each crest. */
  crest: string
  /** Grass speckle, darker and lighter than the hill. */
  speck: [string, string]
  path: [string, string]
  glass: [string, string]
  frame: string
  tree: [string, string]
  grass: [string, string, string]
  stem: string
}

const DAY: Light = {
  sky: [
    [0, '#2457d0'],
    [0.3, '#3f7be6'],
    [0.6, '#7fb6f6'],
    [0.8, '#bfe0ff'],
    [1, '#eef7ff'],
  ],
  clouds: { body: '#c9c9ee', lit: '#ffffff', core: '#ffffff', base: '#a6b5da', light: [-0.16, -0.24] },
  haze: '#d9ebf7',
  mist: '#eff7fd',
  range: ['#a9c8ee', '#cadff3'],
  far: ['#a3d2b2', '#86bd9c'],
  mid: ['#a3dc72', '#62b45c', '#3f8f4f'],
  near: ['#74c25a', '#3f9246', '#21683a'],
  crest: '#eaffbc',
  speck: ['#2a6a36', '#d4f8a8'],
  path: ['#f4e4c4', '#c9ae86'],
  glass: ['#eaf6ff', '#a6d0f2'],
  frame: '#ffffff',
  tree: ['#2b6a40', '#6cbb5e'],
  grass: ['#2f7a3f', '#4a9e48', '#7ccf6a'],
  stem: '#3a8a46',
}

const DUSK: Light = {
  sky: [
    [0, '#2e2380'],
    [0.28, '#5a37a6'],
    [0.52, '#a356b4'],
    [0.72, '#e47fae'],
    [0.86, '#ffad9c'],
    [1, '#ffd4a8'],
  ],
  clouds: { body: '#9a5cb8', lit: '#ffb2b8', core: '#ffd9c4', base: '#ffcdb0', light: [0.06, 0.26] },
  haze: '#c99ac2',
  mist: '#ffcfb6',
  range: ['#9a7cc0', '#b88fc2'],
  far: ['#8075b0', '#6a679c'],
  mid: ['#5f7aa2', '#47608a', '#33476e'],
  near: ['#41587a', '#2d4060', '#1c2944'],
  crest: '#ffc2ae',
  speck: ['#141c30', '#8a9ad0'],
  path: ['#d9b8c8', '#9e80a2'],
  glass: ['#fff2c4', '#ffbe68'],
  frame: '#f6e6f0',
  tree: ['#22284a', '#ffa49c'],
  grass: ['#1e3045', '#2c465e', '#41627a'],
  stem: '#2d4a5a',
}

/**
 * The flowers' colours, as drifts: a head start in the race for ground (so
 * pink takes the most and lilac the least), the drift's colours (the first
 * most often), and the colour at the heart of the small flowers near us. The
 * brand's pink, blue and orange with the flora's pastels.
 */
const DRIFTS: Array<{ bias: number; colours: string[]; heart: string; wash: 'warm' | 'light' | 'cool' }> = [
  { bias: 0.1, colours: ['#f551ab', '#ff6fa3', '#ffb3cf'], heart: '#ffe27a', wash: 'warm' },
  { bias: 0.02, colours: ['#fff8ec', '#ffffff', '#ffe9f2'], heart: '#ffd23f', wash: 'light' },
  { bias: 0.04, colours: ['#ffe27a', '#ffd23f', '#fff2a8'], heart: '#ff8a4c', wash: 'light' },
  { bias: -0.03, colours: ['#3f6dff', '#8cc8ff', '#6f8dff'], heart: '#fff8ec', wash: 'cool' },
  { bias: -0.08, colours: ['#c9a8ff', '#b48cff'], heart: '#ffe27a', wash: 'cool' },
  { bias: -0.02, colours: ['#ff8a4c', '#ff6c3a'], heart: '#2a1a2e', wash: 'warm' },
]

/** The blossoms in front: cosmos in pinks, white and lilac; poppies in orange, pink and butter. */
const COSMOS = ['#f551ab', '#ffb3cf', '#fff8ec', '#ff6fa3', '#c9a8ff', '#f551ab']
const POPPIES = ['#ff6c3a', '#ff8a4c', '#f551ab', '#ffd23f', '#ff6c3a']

const f = (n: number) => n.toFixed(1)

export const flowerField: Painter = async (c, variant) => {
  const { W, H } = c
  const dusk = variant === 'dusk'
  const L = dusk ? DUSK : DAY
  const horizon = H * 0.47 // the vanishing line, just above the farthest hills
  const presence = valueNoise(c)
  const hues = DRIFTS.map(() => valueNoise(c))
  const phase = Array.from({ length: 5 }, () => c.random() * Math.PI * 2)
  const bump = (x: number, at: number, width: number) => Math.exp(-(((x / W - at) / width) ** 2))

  // The hills' crests, far to near.
  const range = (x: number) => H * (0.49 - 0.022 * bump(x, 0.82, 0.18) - 0.014 * bump(x, 0.38, 0.14)) + 3 * Math.sin(x * 0.012 + phase[0])
  const far = (x: number) => H * (0.525 + 0.012 * Math.sin((x / W) * 7.5 + phase[1]) + 0.006 * Math.sin((x / W) * 17 + phase[2]))
  const mid = (x: number) => H * (0.628 - 0.072 * bump(x, 0.2, 0.26) - 0.05 * bump(x, 0.72, 0.2) + 0.005 * Math.sin((x / W) * 11 + phase[3]))
  const near = (x: number) => H * (0.768 - 0.062 * bump(x, 0.07, 0.3) - 0.03 * bump(x, 0.96, 0.18) + 0.008 * Math.sin((x / W) * 5 + phase[4]))
  const outline = (crest: (x: number) => number) => {
    let d = `M -20 ${H + 20}`
    for (let x = -20; x <= W + 20; x += 16) d += ` L ${f(x)} ${f(crest(x))}`
    return `${d} L ${W + 20} ${H + 20} Z`
  }
  const crestLine = (crest: (x: number) => number, dy: number) => {
    let d = `M -20 ${f(crest(-20) + dy)}`
    for (let x = -4; x <= W + 20; x += 16) d += ` L ${f(x)} ${f(crest(x) + dy)}`
    return `<path d="${d}" fill="none" stroke-width="7"/>`
  }
  const hill = (id: string, crest: (x: number) => number, colours: string[], y1: number, y2: number) =>
    `<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${f(y1)}" x2="0" y2="${f(y2)}">${stops(colours.map((col, i) => [i / (colours.length - 1), col]))}</linearGradient></defs><path d="${outline(crest)}" fill="url(#${id})"/>`

  // Where flowers grow and what colour comes from noise laid on the ground,
  // so they fall into drifts: long bands far off, broad patches near.
  const toGround = (x: number, y: number) => {
    const z = (H - horizon) / Math.max(4, y - horizon)
    return [((x - W / 2) / (W * 0.2)) * Math.pow(z, 0.2), Math.log(z) * 3] as const
  }
  // Each colour has its own noise; whichever is strongest takes the ground, so
  // drifts meet edge to edge rather than in rings, with a few strays among them.
  const driftAt = (u: number, v: number) => {
    if (c.chance(0.06)) return c.pick(DRIFTS)
    let best = DRIFTS[0]
    let top = -1
    DRIFTS.forEach((d, i) => {
      const score = hues[i](u * 0.75 + i * 7.3, v * 0.85 + i * 3.1) + d.bias
      if (score > top) {
        top = score
        best = d
      }
    })
    return best
  }

  // Sky: deep blue overhead to a pale haze at the horizon (violet to peach at dusk).
  await c.svg(`<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">${stops(L.sky)}</linearGradient></defs><rect width="${W}" height="${f(H * 0.6)}" fill="url(#sky)"/>`)
  c.stipple({ x: 0, y: 0, w: W, h: H * 0.55 }, { per: 0.006, dark: dusk ? '#241a6a' : '#1a44b0', light: '#ffffff', darkAlpha: 0.22, lightAlpha: 0.16, r: [0.6, 1.3] })
  const stars: Dot[] = []
  if (dusk) {
    // The afterglow where the sun went down, the evening star, a few more coming out.
    const sun = { x: W * 0.62, y: H * 0.5 }
    await c.svg(`<g transform="translate(${f(sun.x)} ${f(sun.y)}) scale(1 0.3) translate(${f(-sun.x)} ${f(-sun.y)})">${halo(sun.x, sun.y, W * 0.4, '#ffd2a0', 0.8)}</g>`)
    stars.push(...c.scatter(70, (_, y) => 1 - y / (H * 0.28), () => ({ r: c.between(0.7, 1.4), colour: '#fff4f8', alpha: c.between(0.35, 0.8) }), { x: 0, y: 0, w: W, h: H * 0.28 }))
    stars.push({ x: W * 0.29, y: H * 0.13, r: 3.2, colour: '#fffbea', alpha: 1 })
    await c.soft(`<circle cx="${f(W * 0.29)}" cy="${f(H * 0.13)}" r="10"/>`, '#ffe9f6', 10, 0.6)
    c.dots(stars)
  }

  // Clouds: a few big fair-weather cumulus, irregular heaps built as soft
  // masses: a lavender body, the tops sprayed bright from the upper left, a
  // flat blue-grey base, the edges and tops speckled. At dusk they're lit
  // from under the horizon instead, and their bodies thin into the sky so the
  // pink fades out at the edges.
  type Blob = { x: number; y: number; r: number }
  const heaps: Array<{ blobs: Blob[]; x: number; base: number; w: number; h: number }> = []
  const cumulus = (cx: number, base: number, w: number, h: number) => {
    const blobs: Blob[] = []
    // A lumpy dome: masses packed in at random under an outline that rises
    // and falls, with a tower or two pushing up out of it, over a broad base.
    const towers = [c.between(0.25, 0.45), c.between(0.55, 0.8)]
    for (let i = 0; i < 36; i++) {
      const t = c.between(0.03, 0.97)
      const swell = Math.sin(Math.PI * t) ** 0.8 * (0.75 + 0.25 * Math.sin(t * 13 + cx)) + towers.reduce((m, at) => m + (dusk ? 0.2 : 0.45) * Math.exp(-(((t - at) / 0.09) ** 2)), 0)
      const r = h * c.between(0.16, 0.34) * (0.55 + 0.45 * Math.min(1, swell))
      blobs.push({ x: cx - w / 2 + w * t, y: Math.min(base - r * 0.3, base - h * Math.min(1.25, swell) * c.between(0.7, 1) + r), r })
    }
    for (let t = 0.05; t < 0.96; t += 0.07) {
      const r = h * 0.22 * (0.6 + 0.4 * Math.sin(Math.PI * t))
      blobs.push({ x: cx - w / 2 + w * t, y: base - r * 0.45, r })
      // And a core, so there are no holes through the middle.
      if (t > 0.12 && t < 0.88) blobs.push({ x: cx - w / 2 + w * t, y: base - h * 0.4 * Math.sin(Math.PI * t), r: h * 0.28 * Math.sin(Math.PI * t) ** 0.5 })
    }
    heaps.push({ blobs, x: cx, base, w, h })
  }
  const squash = dusk ? 0.6 : 1
  const stretch = dusk ? 1.1 : 1
  cumulus(W * 0.74, H * (dusk ? 0.34 : 0.37), W * 0.42 * stretch, H * 0.25 * squash)
  // The small one sits low on the left, under where a title goes.
  cumulus(W * 0.17, H * (dusk ? 0.41 : 0.435), W * 0.24 * stretch, H * 0.105 * squash)
  cumulus(W * 0.46, H * 0.445, W * 0.13 * stretch, H * 0.045)
  const blobs = (list: Blob[], dx = 0, dy = 0, k = 1) => list.map((b) => `<circle cx="${f(b.x + dx * b.r)}" cy="${f(b.y + dy * b.r)}" r="${f(b.r * k)}"/>`).join('')
  const cut = heaps.map((k, i) => `<clipPath id="cut${i}"><rect x="0" y="0" width="${W}" height="${f(k.base)}"/></clipPath>`).join('')
  const groups = (dx = 0, dy = 0, k = 1) => heaps.map((h, i) => `<g clip-path="url(#cut${i})">${blobs(h.blobs, dx, dy, k)}</g>`).join('')
  const masses = (...layers: string[]) => `<defs>${cut}</defs>${layers.join('')}`
  const [lx, ly] = L.clouds.light
  const soften = dusk ? 9 : 5
  await c.soft(masses(groups()), L.clouds.body, soften, dusk ? 0.5 : 1)
  // The lit side, filled in behind so only a rim of the body's shade shows on the far side.
  await c.soft(masses(groups(lx, ly, 0.92), groups(0, 0, dusk ? 0.7 : 0.86)), L.clouds.lit, soften + 1, dusk ? 0.8 : 1)
  await c.soft(masses(groups(lx * 2, ly * 2, 0.6)), L.clouds.core, dusk ? 18 : 12, dusk ? 0.25 : 0.6)
  const within = heaps.map((k, i) => `<clipPath id="in${i}">${blobs(k.blobs)}</clipPath>`).join('')
  await c.soft(`<defs>${cut}${within}</defs>${heaps.map((k, i) => `<g clip-path="url(#cut${i})"><rect clip-path="url(#in${i})" x="${f(k.x - k.w / 2)}" y="${f(k.base - k.h * 0.13)}" width="${f(k.w)}" height="${f(k.h * 0.13)}"/></g>`).join('')}`, L.clouds.base, 9, dusk ? 0.3 : 0.32)
  if (!dusk) await c.soft(`<defs>${cut}${within}</defs>${heaps.map((k, i) => `<g clip-path="url(#cut${i})"><rect clip-path="url(#in${i})" x="${f(k.x - k.w / 2)}" y="${f(k.base - k.h * 0.42)}" width="${f(k.w)}" height="${f(k.h * 0.42)}"/></g>`).join('')}`, L.clouds.body, 16, 0.3)
  const cloud = c.sampler(await c.mask(masses(groups()), 5))
  const sky = { x: 0, y: 0, w: W, h: H * 0.5 }
  c.dots(c.scatter(5000, cloud, () => ({ r: c.between(0.6, 1.3), colour: c.pick([L.clouds.lit, L.clouds.core, L.clouds.base]), alpha: c.between(0.15, 0.45) }), sky))
  c.dots(
    c.scatter(
      3000,
      (x, y) => {
        const a = cloud(x, y)
        return a * (1 - a) * 4
      },
      () => ({ r: c.between(0.6, 1.4), colour: L.clouds.lit, alpha: c.between(0.2, 0.5) }),
      sky,
    ),
  )
  // A pale haze over the far hills, so the distance recedes.
  await c.svg(`<defs><linearGradient id="mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${L.mist}" stop-opacity="0"/><stop offset="0.65" stop-color="${L.mist}" stop-opacity="${dusk ? 0.22 : 0.5}"/><stop offset="1" stop-color="${L.mist}" stop-opacity="${dusk ? 0.38 : 0.85}"/></linearGradient></defs><rect y="${f(H * 0.36)}" width="${W}" height="${f(H * 0.15)}" fill="url(#mist)"/>`)

  // The hills, far to near, each lit along its crest. The far range is hazy;
  // the path winds over the near slope, dips behind its crest and comes up
  // the middle hill to the glasshouse.
  await c.svg(hill('range', range, L.range, H * 0.465, H * 0.52), { blur: 1.4 })
  await c.soft(`<rect x="-50" y="${f(H * 0.47)}" width="${W + 100}" height="${f(H * 0.05)}"/>`, L.haze, 16, 0.35)
  await c.svg(hill('far', far, L.far, H * 0.51, H * 0.6), { blur: 0.8 })
  await c.soft(crestLine(far, 4), L.crest, 4, 0.35)
  await c.svg(hill('mid', mid, L.mid, H * 0.55, H * 0.78))
  await c.soft(crestLine(mid, 5), L.crest, 5, 0.45)
  const pathUp = lane(
    [
      [W * 0.6, H * 0.79],
      [W * 0.632, H * 0.72],
      [W * 0.655, H * 0.66],
      [W * 0.69, H * 0.615],
      [W * 0.705, mid(W * 0.705) + 4],
    ],
    W,
    H,
    horizon,
  )
  const pathIn = lane(
    [
      [W * 0.47, H + 40],
      [W * 0.43, H * 0.93],
      [W * 0.5, H * 0.85],
      [W * 0.565, H * 0.79],
      [W * 0.6, near(W * 0.6) - 8],
    ],
    W,
    H,
    horizon,
  )
  // Washes of colour under the far drifts, so they read as sprayed bands.
  const washes: Record<'warm' | 'light' | 'cool', string> = { warm: '', light: '', cool: '' }
  for (let i = 0; i < 90; i++) {
    const x = c.random() * W
    const y = c.between(H * 0.5, H * 0.75)
    const band = y < mid(x) ? far : y < near(x) ? mid : null
    if (!band || y < band(x) + 6) continue
    const drift = driftAt(...toGround(x, y))
    const rx = radiusAt(y, horizon, H) * c.between(40, 90)
    washes[drift.wash] += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(rx * 0.12)}"/>`
  }
  await c.soft(washes.warm, dusk ? '#ff9ccf' : '#ff8fc4', 6, 0.32)
  await c.soft(washes.light, '#fff1b8', 6, 0.32)
  await c.soft(washes.cool, '#a9b4ff', 6, 0.28)

  await c.shape(pathUp, L.path[0], { blur: 0.8 })
  await c.svg(hill('near', near, L.near, H * 0.69, H))
  await c.soft(crestLine(near, 5), L.crest, 5, 0.4)
  // (Clipped a hair above the crest, so the two stretches of path meet without a seam.)
  const ground = `<defs><clipPath id="ground"><path d="${outline((x) => near(x) - 3)}"/></clipPath></defs>`
  await c.shape(`${ground}<g clip-path="url(#ground)">${pathIn}</g>`, L.path[0], { blur: 0.8 })
  // The path worn darker at its edges, gravel along it.
  await c.soft(`${ground}<g clip-path="url(#ground)" fill="none" stroke-width="10">${pathIn.replace('/>', ' fill="none"/>')}</g>${pathUp.replace('/>', ' fill="none" stroke-width="5"/>')}`, L.path[1], 4, 0.55)
  const onPath = c.sampler(await c.mask(`${ground}<g clip-path="url(#ground)">${pathIn}</g>${pathUp}`, 2))
  c.dots(c.scatter(5000, onPath, (_, y) => ({ r: radiusAt(y, horizon, H) * c.between(0.25, 0.6), colour: c.pick([L.path[1], mix(L.path[0], '#ffffff', 0.4)]), alpha: c.between(0.35, 0.7) }), { x: W * 0.3, y: H * 0.55, w: W * 0.5, h: H * 0.45 }))

  // The flowers: a pointillist field in perspective, tiny and dense on the
  // far hills and opening into small five-petalled flowers near us.
  const hazeAt = (y: number) => Math.min(1, Math.max(0, (H * 0.66 - y) / (H * 0.16))) * 0.45
  const bloomColour = (hex: string, y: number) => {
    const lit = dusk ? mix(hex, '#ffffff', 0.12) : hex
    return mix(lit, L.haze, hazeAt(y))
  }
  const field = { specks: [] as Dot[], flowers: [] as Dot[], hearts: [] as Dot[], glow: [] as Dot[] }
  const sow = (top: (x: number) => number, cover: ((x: number) => number) | null, y0: number, y1: number, rich: number) => {
    for (let y = y0; y < y1; ) {
      const r = radiusAt(y, horizon, H)
      const gap = Math.max(1.6, r * 1.7)
      const step = Math.max(2.2, r * 2.4)
      for (let x = c.random() * step; x < W; x += step * c.between(0.7, 1.3)) {
        const yy = y + c.between(-gap * 0.5, gap * 0.5)
        if (yy < top(x) + r * 1.5 || (cover && yy > cover(x) + r * 2) || onPath(x, yy) > 0.25) continue
        const [u, v] = toGround(x, yy)
        const p = 0.65 * presence(u * 0.9 + 11, v + 3) + 0.35 * presence(u * 2.3 + 4, v * 2.3 + 9)
        if (c.random() > (p > 0.55 ? 0.92 : p > 0.44 ? 0.4 : 0.07) * rich) {
          if (c.chance(0.4)) field.specks.push({ x, y: yy, r: Math.max(0.6, r * 0.7), colour: c.pick(L.speck), alpha: c.between(0.25, 0.55) })
          continue
        }
        const drift = driftAt(u, v)
        const colour = bloomColour(c.chance(0.6) ? drift.colours[0] : c.pick(drift.colours), yy)
        const alpha = c.between(0.85, 1) * (1 - hazeAt(yy) * 0.5)
        if (r >= 3) {
          // A small flower: five petals round a heart, the face tipped towards us.
          const turn = c.random() * Math.PI
          for (let k = 0; k < 5; k++) {
            const a = turn + (k * 2 * Math.PI) / 5
            field.flowers.push({ x: x + Math.cos(a) * r * 0.62, y: yy + Math.sin(a) * r * 0.48, r: r * 0.52, colour, alpha })
          }
          field.hearts.push({ x, y: yy, r: r * 0.32, colour: drift.heart, alpha: 1 })
        } else {
          field.flowers.push({ x, y: yy, r, colour, alpha })
        }
        if (dusk && c.chance(0.12)) field.glow.push({ x, y: yy, r: r * 2.4, colour })
      }
      y += gap
    }
  }
  sow(far, mid, H * 0.495, H * 0.64, 1.05)
  sow(mid, near, H * 0.54, H * 0.79, 1)
  sow(near, null, H * 0.69, H + 6, 0.95)

  c.dots(field.specks)
  if (dusk) await c.soft(field.glow.map((d) => `<circle cx="${f(d.x)}" cy="${f(d.y)}" r="${f(d.r)}"/>`).join(''), '#ffe3f1', 4, 0.32)
  c.dots(field.flowers)
  c.dots(field.hearts)

  // The lone tree on the left hill and the glasshouse on the right one.
  const tree = { x: W * 0.205, y: Math.max(mid(W * 0.2), mid(W * 0.21)) + 4 }
  const crown: Blob[] = []
  for (let i = 0; i < 11; i++) crown.push({ x: tree.x + c.between(-50, 50), y: tree.y - 96 + c.between(-34, 26), r: c.between(26, 44) })
  await c.soft(`<ellipse cx="${f(tree.x + (dusk ? -40 : 30))}" cy="${f(tree.y + 2)}" rx="70" ry="9"/>`, mix(L.mid[2], '#000000', 0.25), 6, 0.5)
  await c.shape(`<path d="M${f(tree.x - 7)} ${f(tree.y + 2)} L ${f(tree.x - 4)} ${f(tree.y - 70)} L ${f(tree.x + 4)} ${f(tree.y - 70)} L ${f(tree.x + 7)} ${f(tree.y + 2)} Z"/>`, mix(L.tree[0], '#2a1a12', 0.4), { blur: 0.8 })
  // The canopy: lit up on the left by day; a silhouette at dusk, rimmed on the side of the afterglow.
  if (dusk) await c.shape(`<g transform="translate(3 -1)">${blobs(crown)}</g>`, L.tree[1], { blur: 1, opacity: 0.7 })
  await c.shape(blobs(crown), L.tree[0], { blur: 1 })
  if (!dusk) {
    await c.shape(blobs(crown.filter(() => c.chance(0.7)), -0.2, -0.22, 0.78), L.tree[1], { blur: 1.2, opacity: 0.85 })
    await c.shape(blobs(crown, 0.12, 0.12, 0.9), L.tree[0], { blur: 1.2, opacity: 0.35 })
  }
  const canopy = c.sampler(await c.mask(blobs(crown), 1))
  c.dots(c.scatter(dusk ? 500 : 1600, canopy, () => ({ r: c.between(0.8, 1.8), colour: dusk ? mix(L.tree[0], '#ffffff', 0.12) : c.pick([L.tree[1], mix(L.tree[0], '#000000', 0.3)]), alpha: c.between(0.3, 0.6) }), { x: tree.x - 110, y: tree.y - 170, w: 220, h: 160 }))

  const house = { x: W * 0.705, y: Math.max(mid(W * 0.705 - 75), mid(W * 0.705 + 155)) + 5 }
  if (dusk) await c.svg(halo(house.x + 40, house.y - 40, 240, '#ffcf86', 0.7))
  await c.svg(glasshouse(house.x, house.y, L, dusk))
  const plants: Dot[] = []
  for (let i = 0; i < 90; i++) plants.push({ x: house.x + c.between(-68, 68), y: house.y - c.between(13, 30), r: c.between(2, 4), colour: c.pick(['#2f7a3f', '#4a9e48', '#5fbf6a', '#f551ab', '#ffe27a']), alpha: dusk ? 0.75 : 0.55 })
  c.dots(plants.filter((p) => Math.abs(p.x - house.x) > 16))
  if (dusk) await c.svg(`<g transform="translate(${f(house.x + 30)} ${f(house.y + 12)}) scale(1 0.16) translate(${f(-house.x - 30)} ${f(-house.y - 12)})">${halo(house.x + 30, house.y + 12, 200, '#ffd28a', 0.65)}</g>`)

  // In front: grass, then the full blossoms on their stems, then a few more blades over them.
  const blooms = placeBlooms(c, W, H)
  const blades = (count: number, area: { x0: number; x1: number; y0: number; y1: number }, tall: [number, number]) => {
    const out: string[] = ['', '', '']
    for (let i = 0; i < count; i++) {
      const x = c.between(area.x0, area.x1)
      const y = c.between(area.y0, area.y1)
      const h = c.between(tall[0], tall[1]) * (0.5 + 0.5 * ((y - H * 0.7) / (H * 0.3)))
      const w = h * c.between(0.04, 0.08)
      const lean = c.between(-0.4, 0.4) * h
      const k = Math.floor(c.random() * 3)
      out[k] += `<path d="M${f(x - w / 2)} ${f(y)} Q ${f(x + lean * 0.3 - w * 0.2)} ${f(y - h * 0.55)} ${f(x + lean)} ${f(y - h)} Q ${f(x + lean * 0.3 + w * 0.3)} ${f(y - h * 0.5)} ${f(x + w / 2)} ${f(y)} Z"/>`
    }
    return out
  }
  const back = blades(900, { x0: -20, x1: W + 20, y0: H * 0.86, y1: H + 30 }, [40, 170])
  for (let k = 0; k < 3; k++) await c.shape(back[k], L.grass[k], { blur: 0.8 })
  if (dusk) await c.svg(blooms.map((b) => halo(b.x, b.y, b.r * 1.9, '#ffd6ec', 0.42)).join(''))
  // A soft shadow behind each blossom, so it stands off the grass.
  await c.soft(blooms.map((b) => `<ellipse cx="${f(b.x + b.r * 0.15)}" cy="${f(b.y + b.r * 0.22)}" rx="${f(b.r)}" ry="${f(b.r * b.tilt)}"/>`).join(''), dusk ? '#0c1222' : '#1d5a2c', 12, dusk ? 0.45 : 0.35)
  // The three nearest are a little out of focus, the rest crisp and speckled.
  const nearest = [...blooms].sort((a, b) => b.y + b.r - (a.y + a.r)).slice(0, 3)
  const crisp = blooms.filter((b) => !nearest.includes(b))
  await c.shape(crisp.map((b) => b.stem).join(''), L.stem, { blur: 0.7 })
  await c.svg(crisp.map((b) => blossom(b, blooms.indexOf(b), dusk)).join(''), { blur: 0.4 })
  const inBloom = (x: number, y: number) => (crisp.some((b) => ((x - b.x) / b.r) ** 2 + ((y - b.y) / (b.r * b.tilt)) ** 2 < 0.85) ? 1 : 0)
  c.dots(c.scatter(4500, inBloom, () => ({ r: c.between(0.6, 1.3), colour: c.pick(['#ffffff', '#ffffff', '#6a1a4a']), alpha: c.between(0.12, 0.32) }), { x: 0, y: H * 0.72, w: W, h: H * 0.28 }))
  await c.shape(nearest.map((b) => b.stem).join(''), L.stem, { blur: 3 })
  await c.svg(nearest.map((b) => blossom(b, blooms.indexOf(b), dusk)).join(''), { blur: 3.5 })
  const front = blades(160, { x0: -20, x1: W + 20, y0: H * 0.96, y1: H + 40 }, [40, 120])
  await c.shape(front[0] + front[1], L.grass[1], { blur: 0.7 })
  c.stipple({ x: 0, y: H * 0.72, w: W, h: H * 0.28 }, { per: 0.006, dark: dusk ? '#0c1222' : '#174a26', light: '#ffffff', darkAlpha: 0.22, lightAlpha: 0.14, r: [0.6, 1.4] })

  // Fireflies over the field at dusk: a soft glow round each, a bright core.
  const fireflies: Dot[] = []
  if (dusk) {
    for (let i = 0; i < 230; i++) {
      const y = c.between(H * 0.56, H * 0.97)
      const depth = (y - horizon) / (H - horizon)
      fireflies.push({ x: c.random() * W, y, r: 0.8 + depth * 2.2, colour: c.pick(['#efff8a', '#fff6a8', '#d9ff6a']), alpha: c.between(0.75, 1) })
    }
    await c.soft(fireflies.map((d) => `<circle cx="${f(d.x)}" cy="${f(d.y)}" r="${f(d.r * 3.2)}"/>`).join(''), '#e8ff7a', 5, 0.5)
    c.dots(fireflies)
  }

  const glints = field.hearts.filter(() => c.chance(dusk ? 0.03 : 0.08))
  const twinkles: Twinkle[] = [...fireflies, ...glints, ...stars.filter(() => c.chance(0.3))].map((d) => [d.x / W, d.y / H, Math.max(1.4, d.r) / W, dusk ? d.colour : '#ffffff'])
  return { motion: { twinkles }, noise: 13 }
}

/** How big a flower reads at height y: a speck at the horizon, a few pixels across in front. */
function radiusAt(y: number, horizon: number, H: number) {
  return Math.min(6.2, Math.max(0.55, 5.6 * Math.pow((y - horizon) / (H - horizon), 1.15)))
}

/** Smooth value noise in [0, 1], seeded from the canvas. */
function valueNoise(c: Canvas) {
  const seed = Math.floor(c.random() * 2 ** 31)
  const lattice = (i: number, j: number) => {
    let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ seed
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296
  }
  return (x: number, y: number) => {
    const i = Math.floor(x)
    const j = Math.floor(y)
    const sx = x - i
    const sy = y - j
    const u = sx * sx * (3 - 2 * sx)
    const v = sy * sy * (3 - 2 * sy)
    const a = lattice(i, j)
    const b = lattice(i + 1, j)
    const d = lattice(i, j + 1)
    const e = lattice(i + 1, j + 1)
    return a + (b - a) * u + (d - a) * v + (a - b - d + e) * u * v
  }
}

/**
 * A path on the ground through these points (a Catmull-Rom curve), its width
 * shrinking into the distance. SVG polygon.
 */
function lane(points: Array<[number, number]>, W: number, H: number, horizon: number) {
  const curve: Array<[number, number]> = []
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]
    for (let s = 0; s < 24; s++) {
      const t = s / 24
      const at = (k: 0 | 1) => 0.5 * (2 * p1[k] + (p2[k] - p0[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * t * t * t)
      curve.push([at(0), at(1)])
    }
  }
  curve.push(points[points.length - 1])
  const left: string[] = []
  const right: string[] = []
  for (const [x, y] of curve) {
    const half = W * 0.066 * Math.max(0.02, (y - horizon) / (H - horizon))
    left.push(`${f(x - half)},${f(y)}`)
    right.unshift(`${f(x + half)},${f(y)}`)
  }
  return `<polygon points="${[...left, ...right].join(' ')}"/>`
}

/** A glasshouse on the hill: its gable end facing us, the long side running back to the right. SVG. */
function glasshouse(x: number, y: number, L: Light, lit: boolean) {
  const w = 150
  const wall = 54
  const rise = 40
  const d = 80 // how far the side runs back
  const up = d * 0.16 // and how much it climbs as it goes
  const glass = (id: string, a: string, b: string) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops([
    [0, a],
    [1, b],
  ])}</linearGradient>`
  const [g0, g1] = L.glass
  const frame = L.frame
  let s = `<defs>${glass('gh-front', g0, g1)}${glass('gh-side', mix(g0, '#5a6a9a', lit ? 0.1 : 0.18), mix(g1, '#4a5a8a', lit ? 0.1 : 0.22))}${glass('gh-roof', mix(g0, '#ffffff', 0.3), g0)}</defs>`
  const l = x - w / 2
  const r = x + w / 2
  // Side wall and roof, running back.
  s += `<polygon points="${f(r)},${f(y)} ${f(r + d)},${f(y - up)} ${f(r + d)},${f(y - up - wall)} ${f(r)},${f(y - wall)}" fill="url(#gh-side)"/>`
  s += `<polygon points="${f(r)},${f(y - wall)} ${f(r + d)},${f(y - up - wall)} ${f(x + d)},${f(y - up - wall - rise)} ${f(x)},${f(y - wall - rise)}" fill="url(#gh-roof)"/>`
  // The gable end.
  s += `<polygon points="${f(l)},${f(y)} ${f(r)},${f(y)} ${f(r)},${f(y - wall)} ${f(x)},${f(y - wall - rise)} ${f(l)},${f(y - wall)}" fill="url(#gh-front)"/>`
  // The door, a darker pane in the middle.
  s += `<rect x="${f(x - 13)}" y="${f(y - 44)}" width="26" height="44" fill="${lit ? '#ffd27a' : '#3f7a55'}" opacity="${lit ? 1 : 0.55}"/>`
  // White frames: the gable's mullions and transom, the side's bays, the ridge and rafters, a low base.
  const bars: string[] = []
  for (let k = 0; k <= 6; k++) {
    const bx = l + (w * k) / 6
    const top = y - wall - rise * (1 - Math.abs(bx - x) / (w / 2))
    bars.push(`<line x1="${f(bx)}" y1="${f(y)}" x2="${f(bx)}" y2="${f(top)}"/>`)
  }
  for (let k = 0; k <= 4; k++) {
    const bx = r + (d * k) / 4
    const by = y - (up * k) / 4
    bars.push(`<line x1="${f(bx)}" y1="${f(by)}" x2="${f(bx)}" y2="${f(by - wall)}"/><line x1="${f(bx)}" y1="${f(by - wall)}" x2="${f(x + (d * k) / 4)}" y2="${f(y - wall - rise - (up * k) / 4)}"/>`)
  }
  bars.push(`<line x1="${f(l)}" y1="${f(y - wall * 0.56)}" x2="${f(r)}" y2="${f(y - wall * 0.56)}"/><line x1="${f(r)}" y1="${f(y - wall * 0.56)}" x2="${f(r + d)}" y2="${f(y - up - wall * 0.56)}"/>`)
  bars.push(`<polyline points="${f(l)},${f(y - wall)} ${f(x)},${f(y - wall - rise)} ${f(r)},${f(y - wall)}" fill="none"/><line x1="${f(x)}" y1="${f(y - wall - rise)}" x2="${f(x + d)}" y2="${f(y - up - wall - rise)}"/>`)
  s += `<g stroke="${frame}" stroke-width="3" stroke-linecap="round">${bars.join('')}</g>`
  s += `<polygon points="${f(l)},${f(y)} ${f(r)},${f(y)} ${f(r + d)},${f(y - up)} ${f(r + d)},${f(y - up - 9)} ${f(r)},${f(y - 9)} ${f(l)},${f(y - 9)}" fill="${mix(frame, '#8a7a90', 0.25)}"/>`
  // The sky caught in the glass.
  if (!lit) s += `<polygon points="${f(l + 20)},${f(y - 9)} ${f(l + 44)},${f(y - 9)} ${f(l + 70)},${f(y - wall - rise * 0.55)} ${f(l + 46)},${f(y - wall - rise * 0.35)}" fill="#ffffff" opacity="0.35"/>`
  return s
}

type Bloom = { x: number; y: number; r: number; kind: 'cosmos' | 'poppy'; colour: string; tilt: number; turn: number; stem: string }

/** The front row: blossoms clustered at either side of the path, larger the nearer they are, each on a curving stem. */
function placeBlooms(c: Canvas, W: number, H: number) {
  const out: Bloom[] = []
  const tryAt = (x: number, y: number, r: number) => {
    if (out.some((b) => Math.hypot(b.x - x, b.y - y) < (b.r + r) * 0.75)) return
    const kind = c.chance(0.6) ? 'cosmos' : 'poppy'
    const bend = c.between(-0.5, 0.5) * r
    // Stem, and a leaf or a bud on its own stalk.
    let stem = `<path d="M${f(x)} ${f(y + r * 0.1)} Q ${f(x + bend * 0.4)} ${f((y + H) / 2)} ${f(x + bend)} ${f(H + 30)}" fill="none" stroke-width="${f(Math.max(2.5, r * 0.07))}"/>`
    if (kind === 'poppy' && c.chance(0.6)) {
      const bx = x + c.between(-1.4, 1.4) * r
      const by = y + c.between(0.4, 1.2) * r
      stem += `<path d="M${f(x + bend * 0.3)} ${f((y + H) / 2 + r * 0.3)} Q ${f(bx)} ${f(by - r * 0.6)} ${f(bx)} ${f(by)}" fill="none" stroke-width="${f(Math.max(2, r * 0.05))}"/><ellipse cx="${f(bx)}" cy="${f(by + r * 0.16)}" rx="${f(r * 0.13)}" ry="${f(r * 0.2)}"/>`
    } else {
      for (let k = 0; k < 3; k++) {
        const ly = y + r * c.between(0.8, 2.2)
        const lx = x + bend * ((ly - y) / (H - y)) * 0.8
        const dir = c.chance(0.5) ? 1 : -1
        stem += `<path d="M${f(lx)} ${f(ly)} q ${f(dir * r * 0.4)} ${f(-r * 0.25)} ${f(dir * r * 0.75)} ${f(-r * 0.1)}" fill="none" stroke-width="${f(Math.max(1.5, r * 0.035))}"/>`
      }
    }
    out.push({ x, y, r, kind, colour: c.pick(kind === 'cosmos' ? COSMOS : POPPIES), tilt: c.between(0.62, 0.95), turn: c.between(0, 360), stem })
  }
  for (let i = 0; i < 120 && out.length < 18; i++) {
    const left = c.chance(0.55)
    const x = left ? c.between(-0.02, 0.32) * W : c.between(0.68, 1.02) * W
    const y = c.between(0.82, 0.99) * H
    tryAt(x, y, 32 + ((y - H * 0.82) / (H * 0.17)) * 74 + c.between(-6, 8))
  }
  // A few smaller ones further back, either side of the path.
  for (const [x, y] of [
    [0.36, 0.83],
    [0.33, 0.88],
    [0.63, 0.86],
    [0.66, 0.81],
  ]) {
    tryAt(W * (x + c.between(-0.015, 0.015)), H * y, c.between(20, 28))
  }
  return out.sort((a, b) => a.y - b.y)
}

/** One blossom, petals shaded from a deeper heart to light tips: a cosmos (eight notched petals) or a poppy (four broad ones round a dark eye). SVG. */
function blossom(b: Bloom, i: number, dusk: boolean) {
  const light = dusk ? mix(b.colour, '#ffffff', 0.4) : mix(b.colour, '#ffffff', 0.5)
  const deep = mix(b.colour, b.kind === 'poppy' ? '#7a1030' : '#7a2a6a', 0.4)
  const id = `bl${i}`
  let s = `<defs><radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="${f(b.r)}">${stops([
    [0, deep],
    [0.32, b.colour],
    [1, light],
  ])}</radialGradient></defs><g transform="translate(${f(b.x)} ${f(b.y)}) scale(1 ${f(b.tilt)}) rotate(${f(b.turn)})">`
  const r = b.r
  const vein = Math.max(0.8, r * 0.014)
  // A soft shadow round the heart, and on a poppy each petal throws one onto
  // the petal it overlaps (drawn just before it).
  const shade = mix(b.colour, '#2a0a2a', 0.6)
  s = s.replace('</defs>', `<filter id="${id}s" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="${f(r * 0.05)}"/></filter></defs>`)
  const shadow = (d: string) => `<path d="${d}" fill="${shade}" opacity="0.32" filter="url(#${id}s)" transform="translate(${f(r * 0.03)} ${f(r * 0.02)})"/>`
  if (b.kind === 'cosmos') {
    // Eight notched petals, each with a pair of pale veins.
    const w = r * 0.34
    const petal = `M0 0 C ${f(w)} ${f(-r * 0.3)} ${f(w * 1.15)} ${f(-r * 0.82)} ${f(w * 0.62)} ${f(-r)} L ${f(w * 0.24)} ${f(-r * 0.93)} L 0 ${f(-r * 1.02)} L ${f(-w * 0.24)} ${f(-r * 0.93)} L ${f(-w * 0.62)} ${f(-r)} C ${f(-w * 1.15)} ${f(-r * 0.82)} ${f(-w)} ${f(-r * 0.3)} 0 0 Z`
    const veins = `<path d="M0 ${f(-r * 0.25)} L ${f(w * 0.3)} ${f(-r * 0.86)} M0 ${f(-r * 0.25)} L ${f(-w * 0.3)} ${f(-r * 0.86)}" fill="none" stroke="${light}" stroke-width="${f(vein)}" opacity="0.5"/>`
    for (let k = 0; k < 8; k++) s += `<g transform="rotate(${k * 45})"><path d="${petal}" fill="url(#${id})"/>${veins}</g>`
    s += `<circle r="${f(r * 0.3)}" fill="${shade}" opacity="0.35" filter="url(#${id}s)"/><circle r="${f(r * 0.24)}" fill="#ffc83a"/><circle r="${f(r * 0.15)}" fill="#f2a21a"/>`
    for (let k = 0; k < 12; k++) s += `<circle cx="${f(Math.cos((k * Math.PI) / 6) * r * 0.2)}" cy="${f(Math.sin((k * Math.PI) / 6) * r * 0.2)}" r="${f(r * 0.03)}" fill="#a85a10"/>`
  } else {
    // Four broad petals, crinkled with fine dark lines from the eye.
    const w = r * 0.66
    const petal = `M0 0 C ${f(w)} ${f(-r * 0.25)} ${f(w * 1.15)} ${f(-r * 0.95)} 0 ${f(-r * 1.02)} C ${f(-w * 1.15)} ${f(-r * 0.95)} ${f(-w)} ${f(-r * 0.25)} 0 0 Z`
    const veins = [-0.5, -0.2, 0.2, 0.5].map((t) => `M0 ${f(-r * 0.2)} Q ${f(w * t * 0.9)} ${f(-r * 0.6)} ${f(w * t * 1.1)} ${f(-r * 0.92)}`).join(' ')
    for (let k = 0; k < 4; k++) s += `<g transform="rotate(${k * 90 + (k % 2) * 8})">${k ? shadow(petal) : ''}<path d="${petal}" fill="url(#${id})"/><path d="${veins}" fill="none" stroke="${deep}" stroke-width="${f(vein)}" opacity="0.28"/></g>`
    s += `<circle r="${f(r * 0.3)}" fill="${mix(b.colour, '#2a0a1a', 0.55)}" opacity="0.7"/><circle r="${f(r * 0.17)}" fill="#2a1a2e"/><circle r="${f(r * 0.08)}" fill="#8a9a6a"/>`
    for (let k = 0; k < 14; k++) s += `<circle cx="${f(Math.cos((k * Math.PI) / 7) * r * 0.22)}" cy="${f(Math.sin((k * Math.PI) / 7) * r * 0.22)}" r="${f(r * 0.028)}" fill="#1a1020"/>`
  }
  return `${s}</g>`
}
