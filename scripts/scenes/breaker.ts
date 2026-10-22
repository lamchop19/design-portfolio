import type { Painter } from '.'
import { type Dot, glints, halo, palm, type Rect, stops, type Twinkle } from './kit'

/** Each variant's inks. Day is the cover's; golden is the same wave at sundown, lit from behind. */
const PALETTES = {
  day: {
    sky: ['#1135a6', '#1d4fc2', '#3b86da', '#86c7ef', '#cdeefa'],
    skyDark: '#0b2585',
    skyLight: '#d6ecff',
    far: ['#2a5fc0', '#1c48a6'],
    farGlint: '#cfe8ff',
    face: ['#143b8e', '#1f60b0', '#2f93c4', '#46b6cb'],
    streaks: ['#5fb7e6', '#7fd0ee', '#2c78c4', '#9be0f0'],
    barrel: '#0c2a6c',
    white: '#ffffff',
    foamBody: '#e7f4fb',
    foamLow: '#a3cbe9',
    foam: ['#ffffff', '#ffffff', '#f4fbff', '#e2f2fb'],
    shade: ['#a3b6e2', '#8fa3d8', '#b5abdc', '#acc8e8'],
    deep: ['#7c86b8', '#8f7fb6'],
    lipBody: '#eaf6fb',
    lip: ['#ffffff', '#ffffff', '#e3f3fb'],
    lipShade: ['#9fb4e2', '#b5abdc'],
    near: ['#8fd6e4', '#5ccbd6', '#36b6c4', '#2aa3b2'],
    lines: ['#ffffff', '#ffffff', '#e6f7fb'],
    glint: '#ffffff',
    sparkle: ['#ffffff', '#e9fbff', '#bdf0f4'],
    bands: ['#1f9a8f', '#16171a', '#f0e6d2', '#b98d6c', '#ead8c0', '#7d5f55', '#a9b2a2'],
    vergeDark: '#3b3550',
    iron: '#121418',
    unlit: '#1f2a28',
    trunk: '#191d1c',
    rings: '#0b0d0d',
    backFronds: '#0a2a24',
    fronds: '#0f4033',
    leaflets: '#2f9e80',
    crown: ['#05140f', '#5fd0a9', '#8fe8c4'],
    sun: null as null | { x: number; y: number; r: number; core: string; glow: string },
  },
  golden: {
    sky: ['#26267f', '#55389e', '#b4508f', '#ee8c74', '#ffd29c'],
    skyDark: '#1a145e',
    skyLight: '#ffe0c0',
    far: ['#3a4aa6', '#2a3a8e'],
    farGlint: '#ffd9ae',
    face: ['#1c2c78', '#2b4b9c', '#3f78b0', '#5a9db8'],
    streaks: ['#7aa2d8', '#f0b49c', '#3a5eae', '#b6cce6'],
    barrel: '#121c56',
    white: '#fff3e6',
    foamBody: '#fbe8da',
    foamLow: '#b0a2d6',
    foam: ['#fff6ec', '#ffffff', '#ffe9d4', '#fbd8c2'],
    shade: ['#a697d4', '#8f85c6', '#be97ce', '#b1aedb'],
    deep: ['#74679c', '#8868a4'],
    lipBody: '#fdeee2',
    lip: ['#fff6ec', '#ffffff', '#ffe0ca'],
    lipShade: ['#a697d4', '#be97ce'],
    near: ['#a9d0d8', '#6bbccc', '#3e9fb8', '#2e86a4'],
    lines: ['#fff6ec', '#ffffff', '#ffe4cf'],
    glint: '#ffe4bd',
    sparkle: ['#fff0d4', '#ffdcae', '#ffffff'],
    bands: ['#1b7a84', '#16141a', '#f2d9c0', '#ad765e', '#e7c5aa', '#6a4a4c', '#9a9696'],
    vergeDark: '#3a2a48',
    iron: '#14121a',
    unlit: '#2a2229',
    trunk: '#1b1519',
    rings: '#0b090c',
    backFronds: '#17152f',
    fronds: '#252a4c',
    leaflets: '#433d6e',
    crown: ['#0c0a1c', '#e8906a', '#ffc48e'],
    sun: { x: 0.43, y: 0.385, r: 0.052, core: '#fff1d0', glow: '#ffb27a' },
  },
}

/**
 * Breaker, after Nagai's cover for Eiichi Ohtaki's "Ame no Wednesday": a long
 * wave breaking in white speckle under a cobalt sky, a traffic light hung on
 * a curved arm and a palm, over the striped verge of a coast road. The lit
 * lamp is the brand green. At golden hour a low sun sits behind the wave and
 * shines through its spray.
 */
export const breaker: Painter = async (c, variant) => {
  const { W, H } = c
  const P = PALETTES[variant as keyof typeof PALETTES] ?? PALETTES.day
  const horizon = H * 0.47
  const base = H * 0.6 // where the wave meets the water in front of it
  const curl = W * 0.64 // where the lip throws forward

  // Sky: cobalt overhead, paling to a hazy cyan at the horizon.
  await c.svg(`<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">${stops([
    [0, P.sky[0]],
    [0.3, P.sky[1]],
    [0.62, P.sky[2]],
    [0.86, P.sky[3]],
    [1, P.sky[4]],
  ])}</linearGradient></defs><rect width="${W}" height="${horizon + 4}" fill="url(#sky)"/>`)
  c.stipple({ x: 0, y: 0, w: W, h: horizon }, { per: 0.006, dark: P.skyDark, light: P.skyLight, darkAlpha: 0.34, lightAlpha: 0.22, r: [0.6, 1.4] })
  // The low sun, behind everything the sea throws up.
  if (P.sun) {
    const sun = { x: W * P.sun.x, y: H * P.sun.y, r: W * P.sun.r }
    await c.svg(halo(sun.x, sun.y, sun.r * 7, P.sun.glow, 0.55) + halo(sun.x, sun.y, sun.r * 2.2, P.sun.core, 0.5))
    await c.shape(`<circle cx="${sun.x}" cy="${sun.y}" r="${sun.r}"/>`, P.sun.core, { blur: 3 })
  }

  // Open sea behind the wave: deep blue at the horizon line.
  await c.svg(`<defs><linearGradient id="far" x1="0" y1="0" x2="0" y2="1">${stops([
    [0, P.far[0]],
    [1, P.far[1]],
  ])}</linearGradient></defs><rect y="${horizon}" width="${W}" height="${base - horizon}" fill="url(#far)"/>`)
  c.rects(glints(c, { top: horizon + 3, bottom: H * 0.52, colour: P.farGlint, per: 0.0006, size: 0.6, alpha: 0.5 }))

  // The wave's face: a smooth swell, dark at the crest and turquoise at its
  // foot, running from the curl out to the right edge as the shoulder.
  const shoulder = `M${curl - W * 0.08} ${H * 0.44} C ${curl + W * 0.06} ${H * 0.43}, ${W * 0.84} ${H * 0.478}, ${W + 20} ${H * 0.492} L ${W + 20} ${base} L ${curl - W * 0.08} ${base} Z`
  await c.svg(`<defs><linearGradient id="face" x1="0" y1="${H * 0.44}" x2="0" y2="${base}" gradientUnits="userSpaceOnUse">${stops([
    [0, P.face[0]],
    [0.42, P.face[1]],
    [0.8, P.face[2]],
    [1, P.face[3]],
  ])}</linearGradient></defs><path d="${shoulder}" fill="url(#face)"/>`, { blur: 1 })
  // Texture on the face: fine streaks of lighter water, following its slope.
  const streaks: Rect[] = []
  for (let i = 0; i < 1100; i++) {
    const x = c.between(curl - W * 0.02, W)
    const crest = H * 0.44 + ((x - curl) / (W - curl)) * H * 0.05
    const y = c.between(crest + 8, base - 4)
    streaks.push({ x, y, w: c.between(6, 46), h: c.between(1, 2.2), colour: c.pick(P.streaks), alpha: c.between(0.2, 0.55) })
  }
  c.rects(streaks)
  // Inside the curl: the barrel, a deeper hollow under the lip.
  await c.soft(`<ellipse cx="${curl + W * 0.018}" cy="${H * 0.505}" rx="${W * 0.04}" ry="${H * 0.05}"/>`, P.barrel, 16, 0.75)
  // A thin line of foam along the shoulder's crest.
  const crestLine: Dot[] = []
  for (let i = 0; i < 2200; i++) {
    const t = c.random()
    const x = curl + W * 0.04 + t * (W - curl)
    const y = H * 0.437 + t * H * 0.055 - Math.sin(t * Math.PI) * H * 0.008 + c.between(-3.5, 3.5) * (1 - t * 0.6)
    crestLine.push({ x, y, r: c.between(0.8, 2.4) * (1 - t * 0.55), colour: P.white, alpha: c.between(0.6, 1) })
  }
  c.dots(crestLine)

  // The whitewater: billows like cauliflower from the left edge to the curl.
  // Each billow is lit up and to the right; its underside is in shadow.
  type Billow = { x: number; y: number; r: number }
  const billows: Billow[] = []
  const crestAt = (x: number) => H * 0.43 - Math.sin(Math.min(1, x / curl) * Math.PI * 0.85) * H * 0.04
  for (let x = -60; x < curl - W * 0.02; x += c.between(70, 130)) {
    const r = H * c.between(0.05, 0.095)
    billows.push({ x, y: crestAt(x) + r * 0.62 + c.between(-1, 1) * H * 0.012, r })
  }
  for (let x = -40; x < curl - W * 0.05; x += c.between(120, 220)) {
    const r = H * c.between(0.04, 0.07)
    billows.push({ x, y: base - r * 0.5, r })
  }
  const body = `<polygon points="-60,${crestAt(0) + H * 0.04} ${curl - W * 0.02},${H * 0.45} ${curl + W * 0.012},${H * 0.53} ${curl - W * 0.01},${base} -60,${base}"/>`
  const foamShape = body + billows.map((b) => `<circle cx="${b.x}" cy="${b.y}" r="${b.r}"/>`).join('')
  const foam = await c.mask(foamShape, 10)
  // A pale body first, so the speckle reads as one mass.
  await c.shape(foamShape, P.foamBody, { blur: 8, opacity: 0.8 })
  await c.soft(`<rect x="-60" y="${H * 0.5}" width="${curl + 60}" height="${base - H * 0.5}"/>`, P.foamLow, 26, 0.3)
  const density = c.sampler(foam, 1.3)
  const area = { x: 0, y: H * 0.3, w: curl + W * 0.06, h: base - H * 0.3 }
  c.dots(c.scatter(78000, density, () => ({ r: c.between(1.1, 3.1), colour: c.pick(P.foam), alpha: c.between(0.75, 1) }), area))
  // Shadow speckle: lavender-grey, gathering low in the mass and in the
  // undersides of the crest billows, never as a pattern.
  const under = (x: number, y: number) => {
    let v = 0
    for (const b of billows) {
      const d = Math.hypot(x - b.x, y - b.y)
      if (d > b.r) continue
      // Lower-left of the billow, fading towards its middle.
      const along = ((x - b.x) * -0.5 + (y - b.y) * 0.85) / b.r
      v = Math.max(v, Math.min(1, Math.max(0, along * 1.3)) * (d / b.r))
    }
    return v
  }
  const low = (y: number) => Math.min(1, Math.max(0, (y - H * 0.47) / (base - H * 0.47)))
  c.dots(c.scatter(14000, (x, y) => density(x, y) * Math.max(low(y) * 0.6, under(x, y) * 0.55), () => ({ r: c.between(1, 2.4), colour: c.pick(P.shade), alpha: c.between(0.45, 0.85) }), area))
  c.dots(c.scatter(4000, density, () => ({ r: c.between(0.7, 1.5), colour: c.pick(P.deep), alpha: c.between(0.3, 0.65) }), area))

  // The lip: foam thrown forward over the barrel and pitching down in front
  // of it, laid as speckle over a pale body like the rest of the foam.
  const lip = `<path d="M${curl - W * 0.04} ${H * 0.43} C ${curl + W * 0.02} ${H * 0.415}, ${curl + W * 0.052} ${H * 0.44}, ${curl + W * 0.056} ${H * 0.485} C ${curl + W * 0.058} ${H * 0.52}, ${curl + W * 0.05} ${H * 0.55}, ${curl + W * 0.04} ${base - H * 0.012}" fill="none" stroke-width="${H * 0.036}" stroke-linecap="round"/>`
  await c.shape(lip, P.lipBody, { blur: 5, opacity: 0.75 })
  const lipMask = await c.mask(lip, 7)
  c.dots(c.scatter(9000, c.sampler(lipMask, 1.1), () => ({ r: c.between(0.9, 2.8), colour: c.pick(P.lip), alpha: c.between(0.7, 1) }), { x: curl - W * 0.06, y: H * 0.38, w: W * 0.14, h: H * 0.24 }))
  c.dots(c.scatter(1500, (x, y) => c.sampler(lipMask)(x, y) * (x < curl + W * 0.04 ? 1 : 0.2), () => ({ r: c.between(0.9, 2), colour: c.pick(P.lipShade), alpha: c.between(0.4, 0.8) }), { x: curl - W * 0.06, y: H * 0.38, w: W * 0.14, h: H * 0.24 }))

  // Spray thrown above the crest, thinning as it rises.
  const sprayed = await c.mask(foamShape, 56)
  const spray = c.scatter(
    9500,
    (x, y) => {
      const i = Math.floor(y) * W + Math.floor(x)
      return Math.max(0, sprayed[i] - foam[i] * 0.95) * 2.4
    },
    () => ({ r: c.between(0.8, 2.4), colour: P.white, alpha: c.between(0.5, 1) }),
    { x: 0, y: H * 0.26, w: curl + W * 0.1, h: H * 0.26 },
  )
  c.dots(spray)

  // In front: the shallows, with lines of broken foam rolling in.
  await c.svg(`<defs><linearGradient id="near" x1="0" y1="${base}" x2="0" y2="${H * 0.8}" gradientUnits="userSpaceOnUse">${stops([
    [0, P.near[0]],
    [0.2, P.near[1]],
    [0.7, P.near[2]],
    [1, P.near[3]],
  ])}</linearGradient></defs><rect y="${base}" width="${W}" height="${H * 0.8 - base}" fill="url(#near)"/>`)
  const lines = Array.from({ length: 7 }, (_, k) => ({ y: base + H * (0.004 + k * k * 0.0028), phase: c.between(0, 9), weight: 1 - k / 8 }))
  const foamLine = (x: number, y: number) => {
    let v = 0
    for (const l of lines) {
      const wobble = Math.sin(x * 0.004 + l.phase) * H * 0.004 + Math.sin(x * 0.013 + l.phase * 2) * H * 0.002
      const near = Math.max(0, 1 - Math.abs(y - l.y - wobble) / (H * 0.006 * (0.5 + l.weight)))
      const broken = 0.55 + 0.45 * Math.sin(x * 0.009 + l.phase * 3)
      v = Math.max(v, near * broken * l.weight)
    }
    return v
  }
  c.dots(c.scatter(30000, foamLine, () => ({ r: c.between(1, 2.8), colour: c.pick(P.lines), alpha: c.between(0.65, 1) }), { x: 0, y: base - 4, w: W, h: H * 0.11 }))
  const shallowGlints = glints(c, { top: H * 0.67, bottom: H * 0.79, colour: P.glint, per: 0.0022, size: 1.1, alpha: 0.95 })
  c.rects(shallowGlints)
  const sparkle = c.scatter(4500, () => 1, () => ({ r: c.between(0.8, 2.2), colour: c.pick(P.sparkle), alpha: c.between(0.5, 1) }), { x: 0, y: H * 0.65, w: W, h: H * 0.14 })
  c.dots(sparkle)

  // The verge: Nagai's stripes, each a flat band with its own speckle, ruled in ink.
  const bands: Array<[number, number, string]> = [
    [0.795, 0.84, P.bands[0]],
    [0.84, 0.846, P.bands[1]],
    [0.846, 0.9, P.bands[2]],
    [0.9, 0.906, P.bands[3]],
    [0.906, 0.935, P.bands[4]],
    [0.935, 0.952, P.bands[5]],
    [0.952, 1.01, P.bands[6]],
  ]
  await c.svg(bands.map(([a, b, colour]) => `<rect y="${H * a}" width="${W}" height="${H * (b - a) + 1}" fill="${colour}"/>`).join(''))
  c.stipple({ x: 0, y: H * 0.795, w: W, h: H * 0.21 }, { per: 0.01, dark: P.vergeDark, light: P.white, darkAlpha: 0.32, lightAlpha: 0.2, r: [0.6, 1.5] })

  // The traffic light: a pole the full height, an arm sagging out over the
  // water, and the head hanging from its end with the green lamp lit.
  const pole = W * 0.765
  const head = { x: W * 0.206, y: H * 0.285, w: W * 0.03, h: H * 0.145 }
  await c.shape(
    `<rect x="${pole - 7}" y="-10" width="14" height="${H + 20}"/>` +
      `<path d="M${pole} ${H * 0.452} C ${W * 0.61} ${H * 0.395}, ${W * 0.42} ${H * 0.318}, ${head.x + head.w * 0.6} ${head.y + head.h * 0.42}" fill="none" stroke-width="9" stroke-linecap="round"/>` +
      `<rect x="${head.x}" y="${head.y}" width="${head.w}" height="${head.h}" rx="5"/>`,
    P.iron,
    { blur: 0.9 },
  )
  const lamp = (i: number) => ({ x: head.x + head.w / 2, y: head.y + head.h * (0.2 + i * 0.3) })
  c.dots([0, 1].map((i) => ({ ...lamp(i), r: head.w * 0.27, colour: P.unlit, alpha: 1 })))
  const lit = lamp(2)
  await c.soft(`<circle cx="${lit.x}" cy="${lit.y}" r="${head.w * 0.9}"/>`, '#81db89', 24, 0.32)
  c.dots([
    { ...lit, r: head.w * 0.29, colour: '#3fbf73', alpha: 1 },
    { ...lit, r: head.w * 0.2, colour: '#81db89', alpha: 1 },
    { x: lit.x - head.w * 0.06, y: lit.y - head.w * 0.06, r: head.w * 0.07, colour: '#e9fff0', alpha: 0.95 },
  ])

  // The palm: dark, its upper leaflets catching the sun (from behind, at golden hour), crowned top right.
  const p = palm(c, { x: W * 0.875, base: H + 20, top: H * 0.26, lean: W * 0.012, width: 30, crown: W * 0.14 })
  await c.shape(p.trunk, P.trunk, { blur: 1 })
  await c.shape(p.rings, P.rings, { blur: 0.8, opacity: 0.8 })
  await c.shape(p.back, P.backFronds, { blur: 1.1 })
  await c.shape(p.fronds, P.fronds, { blur: 1 })
  await c.shape(p.leaflets, P.leaflets, { blur: 0.9 })
  // Speckle over the crown, as the airbrush leaves it.
  const crown = await c.mask(p.back + p.fronds + p.leaflets, 1)
  c.dots(c.scatter(6000, c.sampler(crown), () => ({ r: c.between(0.6, 1.4), colour: c.pick(P.crown), alpha: c.between(0.3, 0.7) }), { x: W * 0.68, y: 0, w: W * 0.32, h: H * 0.6 }))

  // What twinkles over the still: glints in the shallows and spray off the crest.
  const twinkles: Twinkle[] = [
    ...shallowGlints.filter(() => c.chance(0.12)).map((g) => [g.x + g.w / 2, g.y, Math.max(1.2, g.w / 3), P.glint] as const),
    ...spray.filter(() => c.chance(0.03)).map((d) => [d.x, d.y, d.r, P.white] as const),
  ].map(([x, y, r, colour]) => [x / W, y / H, r / W, colour] as Twinkle)

  return { motion: { twinkles }, noise: 14 }
}
