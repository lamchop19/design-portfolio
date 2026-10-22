import type { Painter } from '.'
import { type Canvas, type Dot, glints, palm, type Rect, stops, type Twinkle } from './kit'

/**
 * Coast road, after Nagai's cover for "Umi ni Ikou yo" (Shall we head to the
 * sea?): a red 1962 Thunderbird convertible parked on a pink coast road, a
 * long wave curling in behind it, a band of shallows thick with sparkle, and
 * one very tall palm leaning in from the right. 'golden' is the same road
 * late in the afternoon: an apricot sky, warm foam and long shadows.
 */

type Stops = Array<[number, string]>

type Palette = {
  sky: Stops
  stipple: [dark: string, light: string]
  /** A low sun's glow at the horizon, off to the left. */
  glow?: string
  far: Stops
  face: Stops
  /** Light coming through the thin top of the wave. */
  lit: string
  barrel: string
  foam: string[]
  foamShade: string[]
  foamDark: string[]
  shallows: Stops
  sparkle: string[]
  sand: string
  parapet: [top: string, face: string, line: string]
  road: Stops
  speck: string
  shadow: string
  /** How far shadows reach to the right, as a multiple of midday's. */
  reach: number
  car: { paint: Stops; crease: string; chrome: Stops }
  palm: { trunk: string; rings: string; back: string; fronds: string; leaflets: string; speck: [string, string] }
}

const PALETTES: Record<string, Palette> = {
  day: {
    sky: [
      [0, '#0a2794'],
      [0.4, '#1437a8'],
      [0.72, '#2457bf'],
      [0.9, '#5d93d8'],
      [1, '#a9cff0'],
    ],
    stipple: ['#071c70', '#d2e4ff'],
    far: [
      [0, '#2a62c2'],
      [1, '#1d47a3'],
    ],
    face: [
      [0, '#4fb8dc'],
      [0.1, '#2266b4'],
      [0.32, '#163f96'],
      [0.75, '#2470bb'],
      [1, '#43a3d2'],
    ],
    lit: '#5cc9e2',
    barrel: '#0a2163',
    foam: ['#ffffff', '#ffffff', '#f3faff', '#e1f0fa'],
    foamShade: ['#a3b6e2', '#8fa3d8', '#b5abdc', '#acc8e8'],
    foamDark: ['#7c86b8', '#8f7fb6'],
    shallows: [
      [0, '#2a86cf'],
      [0.3, '#43a9e0'],
      [0.72, '#7acdee'],
      [1, '#ade4f5'],
    ],
    sparkle: ['#ffffff', '#ffffff', '#ecfbff', '#c4effa'],
    sand: '#f6dccf',
    parapet: ['#fff7f3', '#eab0bf', '#c98199'],
    road: [
      [0, '#efb4c2'],
      [1, '#f8d4db'],
    ],
    speck: '#9a5a74',
    shadow: '#4a2f5a',
    reach: 1,
    car: {
      paint: [
        [0, '#ff7a7a'],
        [0.26, '#f43b48'],
        [0.4, '#dc1d2d'],
        [0.56, '#a90f1f'],
        [0.562, '#f2525c'],
        [0.7, '#e0283a'],
        [0.88, '#9c0e1e'],
        [1, '#c03645'],
      ],
      crease: '#ffc4c4',
      chrome: [
        [0, '#ffffff'],
        [0.38, '#cddff2'],
        [0.5, '#56627e'],
        [0.62, '#e8b4c2'],
        [1, '#fff1f4'],
      ],
    },
    palm: { trunk: '#3d2b26', rings: '#1c1210', back: '#0a3021', fronds: '#124a2f', leaflets: '#3f9f57', speck: ['#06180f', '#9ee07e'] },
  },
  golden: {
    sky: [
      [0, '#17207e'],
      [0.3, '#2a2f98'],
      [0.56, '#5a4aa8'],
      [0.75, '#b46f9a'],
      [0.89, '#f19a7c'],
      [1, '#ffcf9c'],
    ],
    stipple: ['#120f5c', '#ffe0c0'],
    glow: '#ffc58a',
    far: [
      [0, '#6a64ac'],
      [1, '#3b4596'],
    ],
    face: [
      [0, '#93b9c4'],
      [0.1, '#3a5aa4'],
      [0.32, '#223b88'],
      [0.75, '#3a64a6'],
      [1, '#6e8cc0'],
    ],
    lit: '#9fc6c8',
    barrel: '#151a58',
    foam: ['#fff9f0', '#fff3e4', '#ffeedd', '#f6e2d8'],
    foamShade: ['#c6a6c6', '#b09ccc', '#d4a9b6', '#bba8d4'],
    foamDark: ['#8a78ac', '#9c78a6'],
    shallows: [
      [0, '#3f6db6'],
      [0.3, '#6a88c6'],
      [0.72, '#c39cc0'],
      [1, '#f1c1b2'],
    ],
    sparkle: ['#fff6e0', '#ffe6b8', '#ffd49a', '#ffffff'],
    sand: '#f6cbb4',
    parapet: ['#fff0e4', '#e2969e', '#b86a7e'],
    road: [
      [0, '#e8a0a5'],
      [1, '#f5c2b6'],
    ],
    speck: '#8a4a5e',
    shadow: '#45254f',
    reach: 2.3,
    car: {
      paint: [
        [0, '#ffa27a'],
        [0.26, '#ff5544'],
        [0.4, '#e02a2e'],
        [0.56, '#9a1222'],
        [0.562, '#ff6a5a'],
        [0.7, '#e8363a'],
        [0.88, '#8e1020'],
        [1, '#c2443f'],
      ],
      crease: '#ffd2b0',
      chrome: [
        [0, '#fff6ea'],
        [0.38, '#e7c9cf'],
        [0.5, '#5a4e78'],
        [0.62, '#f0b0a8'],
        [1, '#ffe9de'],
      ],
    },
    palm: { trunk: '#33201c', rings: '#1a0f0c', back: '#162b26', fronds: '#22463a', leaflets: '#97a85a', speck: ['#0c1a14', '#f2c98a'] },
  },
}


/** A point on a cubic Bézier. */
const bezier = (p: ReadonlyArray<readonly [number, number]>, t: number): [number, number] => {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const d = 3 * u * t * t
  const e = t * t * t
  return [a * p[0][0] + b * p[1][0] + d * p[2][0] + e * p[3][0], a * p[0][1] + b * p[1][1] + d * p[2][1] + e * p[3][1]]
}

export const coastRoad: Painter = async (c, variant) => {
  const P = PALETTES[variant] ?? PALETTES.day
  const { W, H } = c
  const horizon = H * 0.47
  const base = H * 0.625 // the wave's foot
  const edge = H * 0.712 // where the water laps the sand
  const wall = H * 0.742 // the parapet along the road
  const kerb = H * 0.768 // where the road begins
  const curl = W * 0.59 // where the lip throws forward

  // Sky: ultramarine overhead, paling only near the horizon, stippled all over.
  await c.svg(`<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">${stops(P.sky)}</linearGradient></defs><rect width="${W}" height="${horizon + 4}" fill="url(#sky)"/>`)
  c.stipple({ x: 0, y: 0, w: W, h: horizon }, { per: 0.0065, dark: P.stipple[0], light: P.stipple[1], darkAlpha: 0.32, lightAlpha: 0.2, r: [0.6, 1.4] })
  // Late in the day the sun sits low off to the left, warming that end of the sky.
  if (P.glow) {
    await c.svg(
      `<defs><radialGradient id="glow" cx="${W * 0.04}" cy="${horizon}" r="${W * 0.6}" gradientTransform="translate(0 ${horizon}) scale(1 0.42) translate(0 ${-horizon})" gradientUnits="userSpaceOnUse">` +
        `<stop offset="0" stop-color="${P.glow}" stop-opacity="0.75"/><stop offset="0.45" stop-color="${P.glow}" stop-opacity="0.3"/><stop offset="1" stop-color="${P.glow}" stop-opacity="0"/>` +
        `</radialGradient></defs><rect width="${W}" height="${horizon + 2}" fill="url(#glow)"/>`,
    )
  }

  // Open sea behind the wave, with faint glints.
  await c.svg(`<defs><linearGradient id="far" x1="0" y1="0" x2="0" y2="1">${stops(P.far)}</linearGradient></defs><rect y="${horizon}" width="${W}" height="${base - horizon}" fill="url(#far)"/><rect y="${horizon}" width="${W}" height="2" fill="${P.sparkle[2]}" opacity="0.5"/>`)
  c.rects(glints(c, { top: horizon + 3, bottom: H * 0.54, colour: P.sparkle[2], per: 0.0009, size: 0.6, alpha: 0.5 }))
  if (P.glow) c.rects(glints(c, { top: horizon + 2, bottom: H * 0.53, x0: 0, x1: W * 0.45, colour: P.glow, per: 0.003, size: 0.8, alpha: 0.85 }))

  // The shoulder: the clean face of the wave before it breaks, tallest at the
  // curl and running down to the right edge. Translucent near its top.
  const S = [
    [curl - W * 0.07, H * 0.43],
    [curl + W * 0.06, H * 0.385],
    [W * 0.84, H * 0.468],
    [W + 20, H * 0.49],
  ] as const
  const crestLine = Array.from({ length: 201 }, (_, i) => bezier(S, i / 200))
  const crestAt = (x: number) => {
    let best = crestLine[0]
    for (const p of crestLine) if (Math.abs(p[0] - x) < Math.abs(best[0] - x)) best = p
    return best[1]
  }
  const shoulder = `M${S[0][0]} ${S[0][1]} C ${S[1][0]} ${S[1][1]}, ${S[2][0]} ${S[2][1]}, ${S[3][0]} ${S[3][1]} L ${W + 20} ${base} L ${S[0][0]} ${base} Z`
  await c.svg(`<defs><linearGradient id="face" x1="0" y1="${H * 0.39}" x2="0" y2="${base}" gradientUnits="userSpaceOnUse">${stops(P.face)}</linearGradient></defs><path d="${shoulder}" fill="url(#face)"/>`, { blur: 1 })
  const faceMask = await c.mask(`<path d="${shoulder}"/>`, 1)
  const lit = await c.softMask(`<ellipse cx="${curl + W * 0.1}" cy="${H * 0.425}" rx="${W * 0.11}" ry="${H * 0.022}"/>`, 20)
  for (let i = 0; i < lit.length; i++) lit[i] *= faceMask[i]
  c.paintMask(lit, P.lit, 0.55)
  // Streaks of lighter water down the face, following its slope.
  const streaks: Rect[] = []
  for (let i = 0; i < 1300; i++) {
    const x = c.between(curl - W * 0.02, W)
    const y = c.between(crestAt(x) + 10, base - 4)
    streaks.push({ x, y, w: c.between(6, 50), h: c.between(1, 2.2), colour: c.pick(['#5fb7e6', '#7fd0ee', '#2c78c4', '#9be0f0']), alpha: c.between(0.16, 0.45) })
  }
  c.rects(streaks)
  // The barrel: a deep hollow under the lip.
  await c.soft(`<ellipse cx="${curl + W * 0.028}" cy="${H * 0.505}" rx="${W * 0.046}" ry="${H * 0.064}"/>`, P.barrel, 16, 0.82)
  await c.soft(`<ellipse cx="${curl + W * 0.024}" cy="${H * 0.48}" rx="${W * 0.026}" ry="${H * 0.032}"/>`, P.barrel, 8, 0.5)
  // Light off the water at the bottom of the hollow.
  await c.soft(`<ellipse cx="${curl + W * 0.034}" cy="${H * 0.565}" rx="${W * 0.03}" ry="${H * 0.018}"/>`, P.lit, 10, 0.35)

  // The whitewater: where the wave has already broken, a wedge of billows,
  // spent and low at the left edge, rising to the curl.
  const mound = (x: number) => H * (0.555 - 0.125 * Math.pow(Math.min(1, Math.max(0, x / curl)), 1.6))
  type Billow = { x: number; y: number; r: number }
  const billows: Billow[] = []
  for (let x = -40; x < curl - W * 0.015; x += c.between(60, 110)) {
    const r = (base - mound(x)) * c.between(0.28, 0.42)
    billows.push({ x, y: mound(x) + r * 0.72, r })
  }
  for (let x = -40; x < curl - W * 0.04; x += c.between(110, 200)) {
    const r = (base - mound(x)) * c.between(0.2, 0.3)
    billows.push({ x, y: base - r * 0.45, r })
  }
  const body = `<polygon points="-60,${mound(0) + H * 0.03} ${curl * 0.5},${mound(curl * 0.5) + H * 0.035} ${curl - W * 0.02},${mound(curl) + H * 0.025} ${curl + W * 0.012},${H * 0.53} ${curl - W * 0.01},${base} -60,${base}"/>`
  const foamShape = body + billows.map((b) => `<circle cx="${b.x}" cy="${b.y}" r="${b.r}"/>`).join('')
  const foam = await c.mask(foamShape, 10)
  // A pale body first, so the speckle reads as one mass.
  await c.shape(foamShape, P.foam[3], { blur: 8, opacity: 0.8 })
  await c.soft(`<rect x="-60" y="${H * 0.56}" width="${curl + 60}" height="${base - H * 0.56}"/>`, P.foamShade[3], 24, 0.3)
  const density = c.sampler(foam, 1.3)
  const area = { x: 0, y: H * 0.3, w: curl + W * 0.05, h: base - H * 0.3 }
  c.dots(c.scatter(54000, density, () => ({ r: c.between(1.1, 3.1), colour: c.pick(P.foam), alpha: c.between(0.75, 1) }), area))
  // Shadow speckle low in the mass and under each billow, lit from up and right.
  const under = (x: number, y: number) => {
    let v = 0
    for (const b of billows) {
      const d = Math.hypot(x - b.x, y - b.y)
      if (d > b.r) continue
      const along = ((x - b.x) * -0.5 + (y - b.y) * 0.85) / b.r
      v = Math.max(v, Math.min(1, Math.max(0, along * 1.3)) * (d / b.r))
    }
    return v
  }
  const low = (y: number) => Math.min(1, Math.max(0, (y - H * 0.5) / (base - H * 0.5)))
  c.dots(c.scatter(11000, (x, y) => density(x, y) * Math.max(low(y) * 0.6, under(x, y) * 0.55), () => ({ r: c.between(1, 2.4), colour: c.pick(P.foamShade), alpha: c.between(0.45, 0.85) }), area))
  c.dots(c.scatter(3000, density, () => ({ r: c.between(0.7, 1.5), colour: c.pick(P.foamDark), alpha: c.between(0.3, 0.6) }), area))

  // The lip: thrown forward over the barrel and pitching down in front of it,
  // speckle over a pale body like the rest of the foam.
  const lip =
    `<path d="M${curl - W * 0.05} ${H * 0.43} C ${curl + W * 0.015} ${H * 0.39}, ${curl + W * 0.066} ${H * 0.414}, ${curl + W * 0.071} ${H * 0.47}" fill="none" stroke-width="${H * 0.044}" stroke-linecap="round"/>` +
    `<path d="M${curl + W * 0.071} ${H * 0.47} C ${curl + W * 0.074} ${H * 0.52}, ${curl + W * 0.064} ${H * 0.57}, ${curl + W * 0.052} ${base - H * 0.012}" fill="none" stroke-width="${H * 0.032}" stroke-linecap="round"/>`
  await c.shape(lip, P.foam[3], { blur: 5, opacity: 0.8 })
  const lipMask = await c.mask(lip, 7)
  const lipArea = { x: curl - W * 0.07, y: H * 0.36, w: W * 0.16, h: H * 0.28 }
  const lipDensity = c.sampler(lipMask, 1.1)
  c.dots(c.scatter(13000, lipDensity, () => ({ r: c.between(0.9, 2.8), colour: c.pick(P.foam), alpha: c.between(0.7, 1) }), lipArea))
  // Its inner side, over the barrel, in shadow.
  c.dots(c.scatter(1800, (x, y) => lipDensity(x, y) * (x < curl + W * 0.06 && y > H * 0.44 ? 1 : 0.15), () => ({ r: c.between(0.9, 2), colour: c.pick(P.foamShade), alpha: c.between(0.4, 0.8) }), lipArea))

  // Foam feathering along the shoulder's crest, thinning to the right.
  const feather: Dot[] = []
  for (let i = 0; i < 2400; i++) {
    const t = 0.3 + 0.7 * Math.pow(c.random(), 1.9)
    const [x, y] = bezier(S, t)
    const fade = (t - 0.3) / 0.7
    feather.push({ x: x + c.between(-6, 6), y: y + c.between(-4, 3) * (1 - fade * 0.6), r: c.between(0.8, 2.4) * (1 - fade * 0.55), colour: c.pick(P.foam), alpha: c.between(0.55, 1) })
  }
  c.dots(feather)

  // Spray thrown above the crest, thinning as it rises.
  const sprayed = await c.mask(foamShape + lip, 46)
  const spray = c.scatter(
    7000,
    (x, y) => {
      const i = Math.floor(y) * W + Math.floor(x)
      return Math.max(0, sprayed[i] - foam[i] * 0.95 - lipMask[i]) * 2.4
    },
    () => ({ r: c.between(0.8, 2.3), colour: P.foam[0], alpha: c.between(0.5, 1) }),
    { x: 0, y: H * 0.28, w: curl + W * 0.12, h: H * 0.3 },
  )
  c.dots(spray)

  // The shallows: a band of light water crowded with sparkle, foam lines at
  // its back where the broken wave runs in.
  await c.svg(`<defs><linearGradient id="near" x1="0" y1="${base}" x2="0" y2="${edge}" gradientUnits="userSpaceOnUse">${stops(P.shallows)}</linearGradient></defs><rect y="${base}" width="${W}" height="${edge - base + 2}" fill="url(#near)"/>`)
  const lines = Array.from({ length: 4 }, (_, k) => ({ y: base + H * (0.004 + k * k * 0.0036), phase: c.between(0, 9), weight: 1 - k / 5 }))
  const foamLine = (x: number, y: number) => {
    let v = 0
    for (const l of lines) {
      const wobble = Math.sin(x * 0.004 + l.phase) * H * 0.004 + Math.sin(x * 0.013 + l.phase * 2) * H * 0.002
      const near = Math.max(0, 1 - Math.abs(y - l.y - wobble) / (H * 0.005 * (0.5 + l.weight)))
      v = Math.max(v, near * (0.5 + 0.5 * Math.sin(x * 0.009 + l.phase * 3)) * l.weight)
    }
    return v
  }
  c.dots(c.scatter(13000, foamLine, () => ({ r: c.between(1, 2.6), colour: c.pick(P.foam), alpha: c.between(0.65, 1) }), { x: 0, y: base - 4, w: W, h: H * 0.06 }))
  const shallowGlints = glints(c, { top: base + H * 0.03, bottom: edge - 3, colour: P.sparkle[0], per: 0.0034, size: 1, alpha: 0.95 })
  c.rects(shallowGlints)
  const sparkle = c.scatter(14000, (_, y) => 0.35 + 0.65 * Math.min(1, (y - base) / (edge - base)), () => ({ r: c.between(0.8, 2.3), colour: c.pick(P.sparkle), alpha: c.between(0.55, 1) }), { x: 0, y: base + H * 0.012, w: W, h: edge - base - H * 0.014 })
  c.dots(sparkle)

  // The beach: a strip of sand, a lace of foam where the water runs up it.
  await c.svg(`<rect y="${edge}" width="${W}" height="${wall - edge + 2}" fill="${P.sand}"/>`)
  c.stipple({ x: 0, y: edge, w: W, h: wall - edge }, { per: 0.014, dark: P.speck, light: '#ffffff', darkAlpha: 0.3, lightAlpha: 0.3, r: [0.6, 1.4] })
  await c.shape(`<rect y="${edge}" width="${W}" height="${H * 0.006}"/>`, P.shallows[1][1], { blur: 3, opacity: 0.35 })
  const lace = (x: number, y: number) => {
    const wobble = Math.sin(x * 0.006 + 1.3) * H * 0.003 + Math.sin(x * 0.021) * H * 0.0015
    return Math.max(0, 1 - Math.abs(y - edge - wobble) / (H * 0.004)) * (0.55 + 0.45 * Math.sin(x * 0.011 + 0.4))
  }
  c.dots(c.scatter(6500, lace, () => ({ r: c.between(0.8, 2), colour: c.pick(P.foam), alpha: c.between(0.6, 1) }), { x: 0, y: edge - H * 0.012, w: W, h: H * 0.024 }))

  // The parapet along the road: a lit top, its face, and a ruled line under it.
  await c.svg(
    `<rect y="${wall}" width="${W}" height="${H * 0.007}" fill="${P.parapet[0]}"/>` +
      `<rect y="${wall + H * 0.007}" width="${W}" height="${kerb - wall - H * 0.007}" fill="${P.parapet[1]}"/>` +
      `<rect y="${kerb - 3}" width="${W}" height="3" fill="${P.parapet[2]}"/>`,
  )
  // The road: pink, paling towards us, speckled.
  await c.svg(`<defs><linearGradient id="road" x1="0" y1="${kerb}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse">${stops(P.road)}</linearGradient></defs><rect y="${kerb}" width="${W}" height="${H - kerb + 2}" fill="url(#road)"/>`)
  c.stipple({ x: 0, y: wall, w: W, h: H - wall }, { per: 0.012, dark: P.speck, light: '#ffffff', darkAlpha: 0.26, lightAlpha: 0.22, r: [0.6, 1.5] })

  // Shadows, hard-edged and thrown to the right: the palm's trunk across the
  // road, then the car's under it.
  const palmX = W * 0.885
  const palmBase = H * 0.795
  const L = P.reach
  await c.shape(`<path d="M${palmX - 10} ${palmBase} L ${palmX + W * 0.05 * L} ${H + 10} L ${palmX + W * 0.05 * L + 24} ${H + 10} L ${palmX + 10} ${palmBase} Z"/>`, P.shadow, { blur: 1.4, opacity: 0.45 })
  const scale = (W * 0.39) / 1000
  const ground = H * 0.935
  const car = { x: W * 0.11, y: ground - 290 * scale, scale }
  const at = (u: number) => car.x + u * scale
  await c.shape(`<path d="M${at(40)} ${ground - 6} L ${at(990)} ${ground - 10} L ${at(990 + 70 * L)} ${ground + 12} L ${at(40 + 70 * L)} ${ground + 18} Z"/>`, P.shadow, { blur: 1.6, opacity: 0.7 })
  await c.shape([263, 814].map((u) => `<ellipse cx="${at(u)}" cy="${ground}" rx="${58 * scale}" ry="${7 * scale}"/>`).join(''), P.shadow, { blur: 2, opacity: 0.8 })
  const chromeGlints = await paintCar(c, car, P)

  // The palm: very tall, leaning in, its crown at the top right.
  const tree = { x: palmX, base: palmBase, top: H * 0.18, lean: -W * 0.022, width: 26, crown: W * 0.12 }
  const p = palm(c, tree)
  await c.shape(p.trunk, P.palm.trunk, { blur: 1 })
  // The kit's rings drift off a trunk this bowed, so they're laid along its own line here.
  await c.shape(p.rings, P.palm.rings, { blur: 0.8, opacity: 0.55 })
  await c.shape(p.back, P.palm.back, { blur: 1.1 })
  await c.shape(p.fronds, P.palm.fronds, { blur: 1 })
  await c.shape(p.leaflets, P.palm.leaflets, { blur: 0.9 })
  // Speckle over the crown, as the airbrush leaves it.
  const crown = await c.mask(p.back + p.fronds + p.leaflets, 1)
  c.dots(c.scatter(5000, c.sampler(crown), () => ({ r: c.between(0.6, 1.4), colour: c.pick(P.palm.speck), alpha: c.between(0.3, 0.7) }), { x: W * 0.7, y: 0, w: W * 0.3, h: H * 0.5 }))

  // What twinkles: glints and sparkle in the shallows, spray off the crest, the car's chrome.
  const twinkles: Twinkle[] = [
    ...shallowGlints.filter(() => c.chance(0.08)).map((g) => [g.x + g.w / 2, g.y, Math.max(1.2, g.w / 3), P.sparkle[0]] as const),
    ...sparkle.filter(() => c.chance(0.012)).map((d) => [d.x, d.y, d.r, d.colour] as const),
    ...spray.filter(() => c.chance(0.025)).map((d) => [d.x, d.y, d.r, P.foam[0]] as const),
    ...chromeGlints.map((d) => [d.x, d.y, d.r * 1.5, '#ffffff'] as const),
  ].map(([x, y, r, colour]) => [x / W, y / H, r / W, colour] as Twinkle)

  return { motion: { twinkles }, noise: 14 }
}

/**
 * A 1962 Thunderbird convertible in side view, facing right, drawn in a
 * 1000 × 300 box with the ground at y 290, then placed at `x`, `y` and
 * `scale`: the long bullet body with its sharp crease and small fins, the
 * Sports Roadster's headrest fairing over the back seat, a raked windshield,
 * the jet bars on the rear quarter, chrome bumpers and whitewall wheels. The
 * paint is a mirror, as the airbrush does it: sky above a hard horizon line
 * along the side, the road's pink below it. Returns the glints on its chrome.
 */
async function paintCar(c: Canvas, { x, y, scale }: { x: number; y: number; scale: number }, P: Palette) {
  const at = (u: number, v: number) => ({ x: x + u * scale, y: y + v * scale })
  const body = [
    'M20 98', // the fin's tip
    'C 50 104, 100 112, 160 114 L 300 116', // the rear deck
    'C 344 115, 384 92, 430 90 C 452 89, 463 98, 466 116', // the headrest fairing
    'L 640 116', // the cockpit, open
    'C 780 117, 900 121, 968 126 C 990 128, 1000 132, 998 138', // the long hood, to the brow over the lamps
    'L 986 146 L 990 204 C 984 220, 968 230, 944 234 L 902 236', // the nose, tucked under
    'C 898 186, 860 150, 814 150 C 768 150, 730 186, 726 236', // the front wheel arch
    'L 352 240', // the sill
    'C 348 190, 310 154, 263 154 C 216 154, 178 190, 174 238', // the rear wheel arch
    'L 64 236 C 40 232, 22 222, 16 200 C 10 170, 10 130, 20 98 Z', // round the tail
  ].join(' ')
  const arch = (cx: number) => `M${cx - 89} 238 C ${cx - 85} 190, ${cx - 47} 154, ${cx} 154 C ${cx + 47} 154, ${cx + 85} 190, ${cx + 89} 238 Z`
  const wheel = (cx: number) =>
    `<circle cx="${cx}" cy="226" r="64" fill="#141217"/>` +
    `<circle cx="${cx}" cy="226" r="54" fill="#f4f0e6"/>` +
    `<circle cx="${cx}" cy="226" r="42" fill="url(#hub)"/>` +
    `<circle cx="${cx}" cy="226" r="33" fill="none" stroke="#9aa2b2" stroke-width="2"/>` +
    `<circle cx="${cx}" cy="226" r="12" fill="#eef1f6" stroke="#7d8596" stroke-width="2.5"/>`
  const jetBars = [0, 1, 2, 3].map((k) => `<rect x="${60 + k * 8}" y="${146 + k * 10}" width="${96 - k * 14}" height="3.2" rx="1.6" fill="url(#chrome)"/>`).join('')
  await c.svg(
    `<g transform="translate(${x} ${y}) scale(${scale})">` +
      `<defs>` +
      `<linearGradient id="paint" x1="0" y1="74" x2="0" y2="240" gradientUnits="userSpaceOnUse">${stops(P.car.paint)}</linearGradient>` +
      `<linearGradient id="chrome" x1="0" y1="0" x2="0" y2="1">${stops(P.car.chrome)}</linearGradient>` +
      `<linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">${stops([
        [0, '#eef7fc'],
        [0.5, '#a7cde3'],
        [1, '#dcedf7'],
      ])}</linearGradient>` +
      `<radialGradient id="hub" cx="0.4" cy="0.35" r="0.75">${stops([
        [0, '#ffffff'],
        [0.45, '#d5dae3'],
        [1, '#7a8293'],
      ])}</radialGradient>` +
      `</defs>` +
      // In the cockpit, above the door line: the seat back, the steering wheel.
      `<path d="M472 118 C 472 100, 476 88, 486 84 C 496 81, 506 86, 508 96 L 514 118 Z" fill="#f4ead8"/>` +
      `<path d="M502 88 C 507 94, 510 106, 514 118 L 504 118 Z" fill="#cbb99d"/>` +
      `<path d="M576 96 L 612 118" stroke="#1d1a20" stroke-width="5"/>` +
      `<ellipse cx="576" cy="96" rx="4.5" ry="20" transform="rotate(-30 576 96)" fill="none" stroke="#1d1a20" stroke-width="4.5"/>` +
      // The windshield, raked back, its glass showing what's behind it.
      `<path d="M640 117 L 582 36 L 566 38 L 600 117 Z" fill="url(#glass)" opacity="0.5"/>` +
      `<path d="M612 110 L 586 66 M 626 112 L 612 90" stroke="#ffffff" stroke-width="4" opacity="0.65"/>` +
      `<path d="M641 118 L 582 36 L 563 38" fill="none" stroke="url(#chrome)" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>` +
      // The body.
      `<path d="${body}" fill="url(#paint)"/>` +
      // Light along the crease from fin to brow, a sheen on the fairing, and the
      // sky's streak on the upper side.
      `<path d="M22 101 C 52 107, 100 115, 160 117 L 300 119 M 466 119 L 640 119 C 780 120, 900 124, 968 129 C 986 131, 994 134, 996 138" fill="none" stroke="${P.car.crease}" stroke-width="3" opacity="0.85"/>` +
      `<path d="M352 110 C 380 98, 404 93, 432 93" fill="none" stroke="${P.car.crease}" stroke-width="4" stroke-linecap="round" opacity="0.7"/>` +
      `<path d="M40 136 C 300 140, 700 138, 980 146" fill="none" stroke="${P.car.crease}" stroke-width="5" opacity="0.3"/>` +
      // Door seams and handle, the mirror on its stalk.
      `<path d="M468 120 C 470 160, 470 200, 466 236 M 646 120 C 650 160, 650 200, 646 232" fill="none" stroke="#7d0b18" stroke-width="2.5"/>` +
      `<rect x="480" y="128" width="24" height="5" rx="2.5" fill="url(#chrome)"/>` +
      `<path d="M664 116 L 668 102" stroke="#8a93a6" stroke-width="3"/>` +
      `<ellipse cx="670" cy="98" rx="11" ry="6" fill="url(#chrome)"/>` +
      // Chrome: the jet bars on the rear quarter, the sill, the bumpers.
      jetBars +
      `<path d="M352 230 L 726 228 L 726 233 L 352 235 Z" fill="url(#chrome)"/>` +
      `<path d="M10 168 C 2 180, 2 204, 8 214 L 46 216 L 48 170 Z" fill="url(#chrome)"/>` +
      `<path d="M948 158 C 990 156, 1006 170, 1004 186 C 1002 200, 994 210, 978 213 L 948 213 Z" fill="url(#chrome)"/>` +
      // The tail light under the fin, the headlamp under the brow.
      `<path d="M16 118 C 10 126, 10 150, 14 160 L 24 160 L 24 118 Z" fill="#ff2b3a"/>` +
      `<path d="M14 124 L 14 134" stroke="#ffd0d0" stroke-width="3"/>` +
      `<ellipse cx="991" cy="150" rx="6" ry="8" fill="#fff6da"/>` +
      // Wheel wells in shadow, then the wheels.
      `<path d="${arch(263)}" fill="#22070c"/>` +
      `<path d="${arch(814)}" fill="#22070c"/>` +
      wheel(263) +
      wheel(814) +
      `</g>`,
  )
  // The airbrush's speckle over the paint.
  c.stipple({ ...at(10, 84), w: 990 * scale, h: 156 * scale }, { per: 0.01, dark: '#4a0710', light: '#ffd8dc', darkAlpha: 0.2, lightAlpha: 0.14, r: [0.5, 1.1] })
  // Glints of sun on the chrome.
  const glintsOn: Dot[] = [
    { ...at(30, 176), r: 2.4, colour: '#ffffff', alpha: 0.95 },
    { ...at(990, 166), r: 2.6, colour: '#ffffff', alpha: 0.95 },
    { ...at(248, 210), r: 2.2, colour: '#ffffff', alpha: 0.9 },
    { ...at(799, 210), r: 2.2, colour: '#ffffff', alpha: 0.9 },
    { ...at(584, 40), r: 2, colour: '#ffffff', alpha: 0.9 },
  ]
  c.dots(glintsOn)
  return glintsOn
}
