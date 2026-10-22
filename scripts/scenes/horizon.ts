import type { Painter } from '.'
import { type Dot, type Rect, stops, type Twinkle } from './kit'

/**
 * Horizon, after the setting sun on 1980s record sleeves: a banded sun going
 * down into a calm, speckled sea, its light laid towards us as a path of
 * glints, a sailboat small against it. 'night' trades the sun for a big moon
 * in a deep blue sky full of stars, its path silver. Quiet on purpose: the
 * left half is open sky and sea, to set type over.
 */

type Stops = Array<[number, string]>

type Palette = {
  sky: Stops
  stipple: [dark: string, light: string]
  /** Soft light round the sun or moon: colour, opacity, reach as a multiple of the disc's radius. */
  glow: Array<[string, number, number]>
  sea: Stops
  seaStipple: [dark: string, light: string]
  path: string[]
  /** The bright seam where the light meets the horizon. */
  seam: string
  boat: string
}

const PALETTES: Record<string, Palette> = {
  dusk: {
    sky: [
      [0, '#120f4a'],
      [0.34, '#2a2380'],
      [0.58, '#55309a'],
      [0.78, '#963c9c'],
      [0.92, '#d6508c'],
      [1, '#ff8a7a'],
    ],
    stipple: ['#0e1150', '#ffd9e8'],
    glow: [
      ['#ff6a86', 0.42, 4.4],
      ['#ffa07a', 0.42, 1.7],
    ],
    sea: [
      [0, '#4a3592'],
      [0.12, '#2d2679'],
      [0.55, '#1b1b5a'],
      [1, '#0f103c'],
    ],
    seaStipple: ['#090a2e', '#b9a6ff'],
    path: ['#fff2b8', '#ffd47a', '#ffb27a', '#ff8fa3', '#ffe39a'],
    seam: '#ffe6ad',
    boat: '#2a1342',
  },
  night: {
    sky: [
      [0, '#040a26'],
      [0.4, '#0a1648'],
      [0.78, '#16307a'],
      [1, '#2c4f9c'],
    ],
    stipple: ['#020616', '#c9d8ff'],
    glow: [
      ['#7d9bff', 0.42, 5],
      ['#e6eeff', 0.5, 2],
    ],
    sea: [
      [0, '#22397e'],
      [0.12, '#172a66'],
      [0.55, '#0d1a48'],
      [1, '#060c2a'],
    ],
    seaStipple: ['#030716', '#b8c8ff'],
    path: ['#ffffff', '#eef3ff', '#cfdcff', '#b4c6ff', '#ffffff'],
    seam: '#dfe8ff',
    boat: '#050a1e',
  },
}

export const horizon: Painter = async (c, variant) => {
  const night = variant === 'night'
  const P = night ? PALETTES.night : PALETTES.dusk
  const { W, H } = c
  const line = H * 0.62 // the horizon
  const cx = W * 0.6 // the sun or moon stands over this
  const r = night ? H * 0.135 : H * 0.215
  const cy = night ? H * 0.34 : line - r * 0.3
  // Light that falls off smoothly from a point, squashed by `sy`, kept to a band of rows.
  const glow = (x: number, y: number, reach: number, colour: string, opacity: number, sy = 1, band = { top: 0, bottom: H }) =>
    c.svg(
      `<defs><radialGradient id="glow" cx="${x}" cy="${y}" r="${reach}" gradientUnits="userSpaceOnUse" gradientTransform="translate(0 ${y}) scale(1 ${sy}) translate(0 ${-y})">` +
        ([
          [0, 1],
          [0.12, 0.62],
          [0.3, 0.3],
          [0.55, 0.11],
          [1, 0],
        ] as const)
          .map(([o, a]) => `<stop offset="${o}" stop-color="${colour}" stop-opacity="${(a * opacity).toFixed(3)}"/>`)
          .join('') +
        `</radialGradient></defs><rect y="${band.top}" width="${W}" height="${band.bottom - band.top}" fill="url(#glow)"/>`,
    )
  // A standard normal, for scattering glints about the path's middle.
  const gauss = () => Math.sqrt(-2 * Math.log(1 - c.random())) * Math.cos(2 * Math.PI * c.random())

  // Sky: a deep airbrushed gradient, stippled.
  await c.svg(`<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">${stops(P.sky)}</linearGradient></defs><rect width="${W}" height="${line + 2}" fill="url(#sky)"/>`)
  c.stipple({ x: 0, y: 0, w: W, h: line }, { per: 0.006, dark: P.stipple[0], light: P.stipple[1], darkAlpha: 0.3, lightAlpha: 0.16, r: [0.6, 1.3] })

  // Stars at night, thick overhead and thinning into the haze at the horizon.
  const stars: Dot[] = night ? c.scatter(700, (_, y) => Math.pow(1 - y / line, 1.4), () => ({ r: c.pick([0.6, 0.7, 0.8, 1, 1.2, 1.6, 2.1]), colour: c.pick(['#ffffff', '#f4f2ff', '#dfe8ff', '#fff4d6']), alpha: c.between(0.45, 1) }), { x: 0, y: 0, w: W, h: line - 10 }) : []
  c.dots(stars)

  // Light round the disc.
  for (const [colour, opacity, k] of P.glow) await glow(cx, cy, r * k, colour, opacity, 1, { top: 0, bottom: line })

  if (night) {
    // The moon: a big pale disc, its seas faint and soft.
    await c.svg(`<defs><radialGradient id="moon" cx="0.42" cy="0.38" r="0.7">${stops([
      [0, '#fdfcf6'],
      [0.7, '#f0eee6'],
      [1, '#dcdad2'],
    ])}</radialGradient></defs><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#moon)"/>`, { blur: 1 })
    const maria = [
      [-0.3, -0.34, 0.24, 0.18],
      [0.08, -0.3, 0.16, 0.13],
      [0.3, -0.02, 0.17, 0.2],
      [0.5, 0.14, 0.1, 0.12],
      [-0.42, 0.12, 0.2, 0.3],
      [-0.08, 0.36, 0.14, 0.1],
    ]
    await c.shape(maria.map(([dx, dy, rx, ry]) => `<ellipse cx="${cx + dx * r}" cy="${cy + dy * r}" rx="${rx * r}" ry="${ry * r}"/>`).join(''), '#c9c6bc', { blur: 11, opacity: 0.34 })
    const disc = await c.mask(`<circle cx="${cx}" cy="${cy}" r="${r - 1}"/>`)
    c.dots(c.scatter(2600, c.sampler(disc), () => ({ r: c.between(0.5, 1.2), colour: c.pick(['#b4b1a6', '#d6d3c9', '#ffffff']), alpha: c.between(0.25, 0.55) }), { x: cx - r, y: cy - r, w: 2 * r, h: 2 * r }))
  } else {
    // The sun: yellow to rose, cut by bands that thicken as it goes down.
    const from = cy - r * 0.3
    let gaps = ''
    for (let k = 0; k < 7; k++) {
      const t = k / 6
      const y = from + (line - from) * Math.pow(t, 0.9)
      const h = r * (0.028 + 0.09 * t)
      gaps += `<rect x="${cx - r - 4}" y="${y - h / 2}" width="${2 * r + 8}" height="${h}" fill="#000"/>`
    }
    await c.svg(
      `<defs><linearGradient id="sun" x1="0" y1="${cy - r}" x2="0" y2="${line}" gradientUnits="userSpaceOnUse">${stops([
        [0, '#fff4b4'],
        [0.35, '#ffd66c'],
        [0.62, '#ff9e58'],
        [0.85, '#ff6a78'],
        [1, '#ef4c84'],
      ])}</linearGradient>` +
        `<mask id="bands" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/>${gaps}</mask></defs>` +
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#sun)" mask="url(#bands)"/>`,
      { blur: 1 },
    )
    const disc = await c.mask(`<circle cx="${cx}" cy="${cy}" r="${r - 1}"/>`)
    c.dots(c.scatter(3000, c.sampler(disc), () => ({ r: c.between(0.5, 1.2), colour: c.pick(['#fff8d8', '#ffb070', '#e8507a']), alpha: c.between(0.2, 0.45) }), { x: cx - r, y: cy - r, w: 2 * r, h: line - cy + r }))
  }

  // Long thin clouds at dusk, lit underneath, one drawn across the sun.
  if (!night) {
    const streaks: Array<[number, number, number, number]> = [
      [W * 0.38, H * 0.355, W * 0.5, H * 0.012],
      [W * 0.86, H * 0.43, W * 0.3, H * 0.008],
      [W * 0.12, H * 0.5, W * 0.26, H * 0.007],
    ]
    for (const [x, y, w, h] of streaks) {
      const shape = `<path d="M${x - w / 2} ${y} C ${x - w / 4} ${y - h * 1.4}, ${x + w / 4} ${y - h * 1.2}, ${x + w / 2} ${y + h * 0.2} C ${x + w / 4} ${y + h}, ${x - w / 4} ${y + h * 0.9}, ${x - w / 2} ${y} Z"/>`
      await c.shape(shape, '#3a2272', { blur: 3, opacity: 0.55 })
      await c.shape(`<g transform="translate(0 ${h * 0.45})">${shape}</g>`, '#ff8fa0', { blur: 2.5, opacity: 0.32 })
    }
  }

  // The sea: calm, darkening towards us, speckled, with a few long swells.
  await c.svg(`<defs><linearGradient id="sea" x1="0" y1="${line}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse">${stops(P.sea)}</linearGradient></defs><rect y="${line}" width="${W}" height="${H - line}" fill="url(#sea)"/>`)
  c.stipple({ x: 0, y: line, w: W, h: H - line }, { per: 0.009, dark: P.seaStipple[0], light: P.seaStipple[1], darkAlpha: 0.32, lightAlpha: 0.16, r: [0.6, 1.5] })
  const swells: Rect[] = []
  for (let i = 0; i < 420; i++) {
    const depth = Math.pow(c.random(), 1.6)
    const y = line + 4 + depth * (H - line - 4)
    swells.push({ x: c.between(-40, W), y, w: c.between(20, 160) * (0.3 + depth * 1.6), h: Math.max(1, depth * 2.6), colour: P.seaStipple[1], alpha: c.between(0.06, 0.16) })
  }
  c.rects(swells)

  // The light on the water: a soft column first, then the path of glints,
  // narrow and crowded at the horizon, wide and loose in front of us.
  await glow(cx, line, (H - line) * 1.1, P.path[2], night ? 0.3 : 0.38, 1, { top: line, bottom: H })
  await glow(cx, line, r * 2.4, P.seam, night ? 0.35 : 0.45, 0.12, { top: line, bottom: H })
  await c.soft(`<ellipse cx="${cx}" cy="${line + 1}" rx="${r * 1.6}" ry="4"/>`, P.seam, 5, 0.85)
  const path: Rect[] = []
  for (let i = 0; i < 3400; i++) {
    const depth = Math.pow(c.random(), 1.35)
    const y = line + 3 + depth * (H - line - 3)
    const spread = r * (night ? 0.5 : 0.62) * (1 + depth * 2.4)
    const off = gauss() * spread * 0.45
    const fade = Math.max(0, 1 - Math.abs(off) / (spread * 1.25))
    if (fade <= 0.02) continue
    const w = (5 + depth * 58) * c.between(0.35, 1.3)
    path.push({ x: cx + off - w / 2, y, w, h: Math.max(1, 0.9 + depth * 3), colour: c.pick(P.path), alpha: c.between(0.5, 1) * fade })
  }
  c.rects(path)

  // A sailboat, far out, its silhouette on the light.
  const bx = cx - r * (night ? 0.55 : 0.5)
  const s = H * 0.062 // the mast's height
  await c.shape(
    `<path d="M${bx - s * 0.62} ${line - s * 0.06} L ${bx + s * 0.62} ${line - s * 0.06} L ${bx + s * 0.48} ${line + s * 0.05} L ${bx - s * 0.5} ${line + s * 0.05} Z"/>` +
      `<path d="M${bx + s * 0.03} ${line - s * 1.02} L ${bx + s * 0.03} ${line - s * 0.1} L ${bx + s * 0.56} ${line - s * 0.1} Z"/>` +
      `<path d="M${bx - s * 0.03} ${line - s * 0.92} L ${bx - s * 0.03} ${line - s * 0.1} L ${bx - s * 0.44} ${line - s * 0.1} Z"/>` +
      `<rect x="${bx - 1.5}" y="${line - s * 1.06}" width="3" height="${s}"/>`,
    P.boat,
    { blur: 0.9 },
  )
  // Its reflection, broken by the swell.
  c.rects(Array.from({ length: 7 }, (_, k) => ({ x: bx - s * (0.5 - k * 0.04) + c.between(-3, 3), y: line + s * 0.08 + k * 5, w: s * (0.9 - k * 0.1), h: 2, colour: P.boat, alpha: 0.5 - k * 0.06 })))

  // What twinkles: the brightest glints on the path, as small sparks rather than discs, and the stars.
  const twinkles: Twinkle[] = [
    ...path.filter((g) => (g.alpha ?? 1) > 0.6 && c.chance(night ? 0.08 : 0.2)).map((g) => [g.x + g.w / 2, g.y, Math.min(2.8, Math.max(1.2, g.w / 10)), g.colour] as const),
    ...stars.filter((d) => d.r >= 1 && c.chance(0.4)).map((d) => [d.x, d.y, d.r, d.colour] as const),
  ].map(([x, y, rr, colour]) => [x / W, y / H, rr / W, colour] as Twinkle)

  return { motion: { twinkles }, noise: 13 }
}
