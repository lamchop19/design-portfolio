import type { Painter } from '.'
import { Canvas, type Dot, halo, type Rect, stops, type Twinkle } from './kit'

/** Each variant's inks: dusk is the painting's violet; night is later, under a moon, with fewer windows lit. */
const PALETTES = {
  dusk: {
    sky: ['#16248a', '#2633a6', '#4a43b9', '#7d5cc4', '#c58bc9', '#e7acc9'],
    skyDark: '#0d1560',
    skyLight: '#f0d6ff',
    stars: { count: 140, depth: 0.3 },
    moon: null as null | { x: number; y: number; r: number },
    sea: ['#2a3aa8', '#1f2d91', '#18247a'],
    horizon: '#9c95e6',
    swell: '#8f93e8',
    haze: '#5b3f8a',
    tower: '#0b1030',
    lit: [0.25, 0.7] as [number, number],
    night: false,
  },
  night: {
    sky: ['#05081f', '#081038', '#0e1650', '#171e62', '#262a72', '#3b3482'],
    skyDark: '#02040f',
    skyLight: '#c8c4ff',
    stars: { count: 900, depth: 0.5 },
    moon: { x: 0.8, y: 0.16, r: 0.021 },
    sea: ['#141b56', '#0f1546', '#0a1034'],
    horizon: '#5d5cb4',
    swell: '#4c54b6',
    haze: '#40306e',
    tower: '#060920',
    lit: [0.1, 0.42] as [number, number],
    night: true,
  },
}

/**
 * Night flight, after Nagai's airliner over the city at dusk: a jet crossing
 * a violet sky over a band of sea, the city below a field of lights in rows
 * that shrink towards the horizon, and a cluster of towers whose windows are
 * a dot-matrix. The jet is its own layer, so it can fly on the site. The
 * night variant is the same flight later on, under a moon.
 */
export const nightFlight: Painter = async (c, variant) => {
  const { W, H } = c
  const P = PALETTES[variant as keyof typeof PALETTES] ?? PALETTES.dusk
  const sea = H * 0.53 // the top of the sea band
  const shore = H * 0.585 // where the city begins

  // Sky: deep blue overhead through violet to a pink glow above the sea.
  await c.svg(`<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">${stops([
    [0, P.sky[0]],
    [0.28, P.sky[1]],
    [0.55, P.sky[2]],
    [0.76, P.sky[3]],
    [0.92, P.sky[4]],
    [1, P.sky[5]],
  ])}</linearGradient></defs><rect width="${W}" height="${sea + 2}" fill="url(#sky)"/>`)
  c.stipple({ x: 0, y: 0, w: W, h: sea }, { per: 0.006, dark: P.skyDark, light: P.skyLight, darkAlpha: 0.3, lightAlpha: 0.18, r: [0.6, 1.3] })
  // Stars: a few early ones high up at dusk, the whole sky full at night.
  const { count, depth } = P.stars
  const stars = c.scatter(count, (_, y) => 1 - y / (H * depth), () => ({ r: c.between(0.7, 1.6), colour: '#f4efff', alpha: c.between(0.4, 0.9) }), { x: 0, y: 0, w: W, h: H * depth })
  c.dots(stars)
  // The moon, haloed, with its path laid on the sea below.
  const moonGlints: Rect[] = []
  if (P.moon) {
    const m = { x: W * P.moon.x, y: H * P.moon.y, r: W * P.moon.r }
    await c.svg(halo(m.x, m.y, m.r * 9, '#7471d0', 0.5) + halo(m.x, m.y, m.r * 2.6, '#d9d6ff', 0.45))
    await c.shape(`<circle cx="${m.x}" cy="${m.y}" r="${m.r}"/>`, '#f6f2ff', { blur: 1.5 })
    // Its seas: a few faint grey patches.
    for (let i = 0; i < 5; i++) {
      await c.soft(`<circle cx="${m.x + c.between(-0.45, 0.45) * m.r}" cy="${m.y + c.between(-0.45, 0.45) * m.r}" r="${m.r * c.between(0.12, 0.26)}"/>`, '#cfc9ea', 6, 0.35)
    }
    for (let i = 0; i < 160; i++) {
      const y = c.between(sea + 3, shore - 3)
      const spread = W * (0.004 + ((y - sea) / (shore - sea)) * 0.03)
      moonGlints.push({ x: m.x + c.between(-1, 1) * spread, y, w: c.between(3, 16), h: 1.3, colour: '#e9e6ff', alpha: c.between(0.4, 0.95) })
    }
  }

  // The sea: a deep blue band with a pale line at the horizon and the far
  // shore's lights strung along it.
  await c.svg(`<defs><linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">${stops([
    [0, P.sea[0]],
    [0.6, P.sea[1]],
    [1, P.sea[2]],
  ])}</linearGradient></defs><rect y="${sea}" width="${W}" height="${shore - sea + 2}" fill="url(#sea)"/><rect y="${sea}" width="${W}" height="2" fill="${P.horizon}" opacity="0.7"/>`)
  c.rects(Array.from({ length: 260 }, () => ({ x: c.between(0, W), y: c.between(sea + 4, shore - 4), w: c.between(4, 24), h: 1.2, colour: P.swell, alpha: c.between(0.15, 0.45) })))
  c.rects(moonGlints)
  c.dots(Array.from({ length: 120 }, () => ({ x: c.between(W * 0.62, W), y: sea + c.between(-1.5, 1.5), r: c.between(0.6, 1.2), colour: c.pick(['#fff1c2', '#ffd27a', '#e9f0ff']), alpha: c.between(0.6, 1) })))

  // The city at night: dark ground, then the lights.
  await c.svg(`<defs><linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">${stops([
    [0, '#141a3e'],
    [0.25, '#0c1130'],
    [1, '#06091b'],
  ])}</linearGradient></defs><rect y="${shore}" width="${W}" height="${H - shore}" fill="url(#ground)"/>`)
  // A haze of light over the city, warmest at the shore.
  await c.soft(`<rect x="-100" y="${shore - H * 0.02}" width="${W + 200}" height="${H * 0.06}"/>`, P.haze, 30, 0.35)

  // Rows of lights in perspective: tight and tiny at the shore, loose and big in front.
  const LIGHTS = ['#fff6d8', '#fff6d8', '#ffe08a', '#ffd166', '#f5f8ff', '#f5f8ff', '#9ad7ff', '#ff7a7a', '#7dffb6']
  const park = (x: number, y: number) => 0.55 + 0.45 * Math.sin(x * 0.0031 + Math.sin(y * 0.011) * 2) * Math.sin(y * 0.017 + x * 0.0009)
  const lights: Dot[] = []
  let y = shore + 3
  while (y < H + 10) {
    const depth = (y - shore) / (H - shore)
    const gap = 3 + depth * depth * 26
    const size = 0.6 + depth * 3.2
    const perRow = Math.round(W / (2.2 + depth * 16))
    // Some rows are boulevards: denser, in sodium orange.
    const boulevard = c.chance(0.12)
    for (let i = 0; i < perRow * (boulevard ? 2.2 : 1); i++) {
      const x = c.random() * W
      if (!boulevard && c.random() > park(x, y)) continue
      lights.push({ x, y: y + c.between(-gap * 0.3, gap * 0.3), r: size * c.between(0.55, 1.15), colour: boulevard ? c.pick(['#ffb347', '#ffc76b', '#ffe08a']) : c.pick(LIGHTS), alpha: c.between(0.55, 1) })
    }
    y += gap
  }
  // Avenues running in towards the horizon: lines of lights converging on a point beyond the city.
  const vanish = { x: W * 0.55, y: sea - H * 0.05 }
  for (let k = 0; k < 9; k++) {
    const footX = c.between(-0.4, 1.4) * W
    for (let i = 0; i < 260; i++) {
      const t = c.random()
      const yy = shore + (H - shore) * t
      const s = (yy - vanish.y) / (H - vanish.y)
      lights.push({ x: vanish.x + (footX - vanish.x) * s + c.between(-1, 1), y: yy, r: 0.6 + t * 2.6, colour: c.pick(['#ffd27a', '#fff1c2', '#ffb347']), alpha: c.between(0.6, 1) })
    }
  }
  // Soft glow under the brightest so the field reads as light, not just dots.
  const glowSpots = lights.filter((d) => d.r > 2.4 && c.chance(0.25))
  await c.soft(glowSpots.map((d) => `<circle cx="${d.x}" cy="${d.y}" r="${d.r * 3}"/>`).join(''), '#ffcf7a', 6, 0.28)
  c.dots(lights)

  // Downtown: towers whose windows are a grid of lit and dark cells.
  const towers: Array<{ x: number; w: number; top: number; foot: number }> = []
  const cluster = (cx: number, spread: number, count: number, tall: number) => {
    for (let i = 0; i < count; i++) {
      const w = c.between(40, 120)
      const foot = H * c.between(0.74, 0.8)
      towers.push({ x: cx + c.between(-spread, spread), w, top: foot - c.between(0.25, 1) * tall, foot })
    }
  }
  cluster(W * 0.72, W * 0.1, 14, H * 0.24)
  cluster(W * 0.2, W * 0.05, 6, H * 0.13)
  towers.sort((a, b) => a.foot - b.foot)
  const windows: Rect[] = []
  const tips: Dot[] = []
  for (const t of towers) {
    await c.shape(`<rect x="${t.x}" y="${t.top}" width="${t.w}" height="${t.foot - t.top}"/>`, P.tower, { blur: 0.6 })
    const cellW = c.pick([5, 6, 7])
    const cellH = c.pick([5, 6, 7])
    const fill = c.between(...P.lit)
    const tint = c.pick(['#f2f5ff', '#fff3cf', '#e2ecff'])
    for (let wy = t.top + 6; wy < t.foot - 4; wy += cellH) {
      // Whole floors go dark or lit together now and then.
      const floor = c.chance(0.15) ? 0 : c.chance(0.12) ? 1 : fill
      for (let wx = t.x + 4; wx < t.x + t.w - 4; wx += cellW) {
        if (c.random() < floor) windows.push({ x: wx, y: wy, w: cellW - 2.2, h: cellH - 2.4, colour: tint, alpha: c.between(0.6, 1) })
      }
    }
    if (c.chance(0.6)) tips.push({ x: t.x + t.w / 2, y: t.top - 3, r: 2.2, colour: '#ff4d4d', alpha: 1 })
  }
  c.rects(windows)
  c.dots(tips)

  // The jet: its own layer, flying left, lit by the dusk from below.
  const plane = new Canvas({ width: 720, height: 170 }, 'night-flight-plane')
  await paintJet(plane, P.night)

  const twinkles: Twinkle[] = [...lights.filter(() => c.chance(0.035)), ...tips, ...(P.night ? stars.filter(() => c.chance(0.08)) : [])].map((d) => [d.x / W, d.y / H, Math.max(1.2, d.r) / W, d.colour])
  return {
    motion: { twinkles, sprites: [{ file: 'plane', x: 0.34, y: 0.37, w: 0.27, motion: 'fly', speed: 1 }] },
    layers: { plane },
    noise: 13,
  }
}

/**
 * A three-engined jet in side view, nose to the left, in a 720 × 170 box: a
 * 727, as in Nagai's painting. At night it's lit from the city below, its
 * cabin windows are lit, and its beacons are on.
 */
async function paintJet(p: Canvas, night: boolean) {
  const body = `M30 92 C 30 70, 60 58, 110 57 L 560 54 C 610 53, 650 44, 680 26 L 700 26 L 688 72 C 676 92, 640 104, 600 106 L 110 114 C 58 114, 30 108, 30 92 Z`
  await p.svg(
    `<defs><linearGradient id="hull" x1="0" y1="0" x2="0" y2="1">${stops([
      [0, night ? '#c6c9e2' : '#f6f7fd'],
      [0.5, night ? '#a6aac8' : '#dcdff0'],
      [0.8, night ? '#77789f' : '#b8abd0'],
      [1, night ? '#b38a8e' : '#d9a8c7'],
    ])}</linearGradient></defs>` +
      // Tail fin, swept back, and the stabiliser across its top.
      `<path d="M588 58 L 630 2 L 678 2 L 662 58 Z" fill="#e6e8f5"/>` +
      `<path d="M616 6 L 708 1 L 712 10 L 630 16 Z" fill="#c9cde3"/>` +
      `<path d="${body}" fill="url(#hull)"/>` +
      // The wing, seen edge-on, hanging below the middle of the fuselage.
      `<path d="M290 100 L 420 100 L 472 126 L 322 120 Z" fill="#9ea3c4"/>` +
      // Engines at the tail, and the intake of the third at the fin's root.
      `<path d="M520 70 C 520 60, 540 56, 590 56 L 612 58 L 612 82 L 590 84 C 540 84, 520 80, 520 70 Z" fill="#c4c8de"/>` +
      `<ellipse cx="524" cy="70" rx="5" ry="12" fill="#4a4f6b"/>` +
      `<path d="M598 50 L 626 46 L 626 54 L 598 56 Z" fill="#b7bbd4"/>` +
      // Cheatline in the brand blue, and the cockpit.
      `<path d="M50 94 L 600 87 L 600 94 L 52 101 Z" fill="#0059ff"/>` +
      `<path d="M46 84 C 52 76, 64 73, 78 73 L 76 84 Z" fill="#2c3150"/>`,
  )
  // Windows: a dotted row along the fuselage.
  const windows: Rect[] = []
  for (let x = 100; x < 512; x += 9) windows.push({ x, y: 75, w: 4.6, h: 4.4, colour: night ? '#ffe3a1' : '#2a2f4a', alpha: 0.9 })
  p.rects(windows)
  if (night) {
    // Beacons: red above and below the fuselage, a white strobe on the tail.
    await p.soft('<circle cx="330" cy="54" r="7"/><circle cx="360" cy="116" r="7"/>', '#ff4d5e', 5, 0.8)
    await p.soft('<circle cx="700" cy="4" r="7"/>', '#ffffff', 5, 0.8)
    p.dots([
      { x: 330, y: 54, r: 2.6, colour: '#ff6b78' },
      { x: 360, y: 116, r: 2.6, colour: '#ff6b78' },
      { x: 700, y: 4, r: 2.6, colour: '#ffffff' },
    ])
  }
  p.stipple({ x: 30, y: 0, w: 690, h: 126 }, { per: 0.01, dark: '#5a5f86', light: '#ffffff', darkAlpha: 0.25, lightAlpha: 0.25, r: [0.5, 1] })
}
