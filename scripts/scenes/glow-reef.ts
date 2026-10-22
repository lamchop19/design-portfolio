import type { Painter } from '.'
import { Canvas, type Dot, halo, mix, rgbOf, stops, type Twinkle } from './kit'
import { alphaAt, brain, type Coral, fadePatch, flat, lay, net, patch, plates, seaFan, staghorn } from './reef'

/**
 * Glow reef, after the DVD menu's glowing jellies: the reef after dark. Deep
 * navy water under a faint moonlit surface; corals glow in the brand's inks
 * (blue, pink, green) with soft halos, row on row dimming into the dark, and
 * a bommie glows like a lantern a little left of centre; plankton drifts in
 * dot-matrix veils, the logo's dot screen lit up; and jellies lit from
 * inside float on their own layer, so they can bob. The water above the
 * bommie is left dark, for type.
 */

/** Deep water at night: what everything fades into with distance. */
const NIGHT = '#0c1b52'

/** The brand's inks, and a cyan and a violet to go between them. */
const BLUE = '#0059ff'
const PINK = '#f551ab'
const GREEN = '#81db89'
const CYAN = '#5fe3ff'
const VIOLET = '#9b6bff'
const INKS = [BLUE, PINK, GREEN, PINK, GREEN, CYAN, VIOLET]

/** Plankton light, after the DVD menu's specks. */
const PLANKTON = ['#9af3ff', '#7af0ff', '#b6ff9a', '#ffbef0', '#8fb4ff']

export const glowReef: Painter = async (c) => {
  const { W, H } = c
  const line = H * 0.64 // the far edge of the sand

  // Water: faintly lit under the surface, deep navy below.
  await c.svg(`<defs><linearGradient id="water" x1="0" y1="0" x2="0" y2="1">${stops([
    [0, '#2b4ca6'],
    [0.05, '#1c3888'],
    [0.2, '#12286e'],
    [0.45, '#0c1c56'],
    [0.64, NIGHT],
    [1, NIGHT],
  ])}</linearGradient></defs><rect width="${W}" height="${H}" fill="url(#water)"/>`)
  c.stipple({ x: 0, y: 0, w: W, h: line }, { per: 0.005, dark: '#050c33', light: '#8fb0ff', darkAlpha: 0.3, lightAlpha: 0.14, r: [0.6, 1.3] })

  // The moon through the surface: a soft glow, the ripples lit near it, and faint shafts.
  const moon = { x: W * 0.3, y: -H * 0.03 }
  await c.svg(halo(moon.x, moon.y, W * 0.34, '#7f9cf0', 0.32) + halo(moon.x, moon.y, W * 0.09, '#e3ebff', 0.7))
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
  const lit = await patch(ripples, { x: 0, y: 0, w: W, h: H * 0.11 }, 1.3)
  fadePatch(lit, (x) => 0.22 + 0.78 * Math.exp(-(((x - moon.x) / (W * 0.16)) ** 2)))
  lay(c, lit, flat('#c3d4ff'), () => 0, 0.6)
  const moonGlints = c.scatter(260, (x, y) => Math.exp(-(((x - moon.x) / (W * 0.13)) ** 2)) * Math.max(0, 1 - y / (H * 0.08)), () => ({ r: c.between(0.8, 2), colour: c.pick(['#ffffff', '#dfe8ff']), alpha: c.between(0.5, 1) }), { x: 0, y: 0, w: W, h: H * 0.08 })
  c.dots(moonGlints)
  for (let i = 0; i < 5; i++) {
    const x = moon.x + c.between(-0.14, 0.14) * W
    const spread = c.between(0.015, 0.04) * W
    const lean = (x - moon.x) * 2.2 + c.between(-0.03, 0.03) * W
    const reach = H * c.between(0.45, 0.7)
    const shaft = await c.softMask(`<path d="M${x - spread * 0.25} 0 L${x + spread * 0.25} 0 L${x + lean + spread} ${reach} L${x + lean - spread} ${reach} Z"/>`, W * 0.012)
    for (let y = 0; y < H; y++) {
      const fade = Math.max(0, 1 - y / reach)
      for (let x2 = 0, o = y * W; x2 < W; x2++, o++) shaft[o] *= fade
    }
    c.paintMask(shaft, '#a8c0ff', c.between(0.05, 0.1))
  }

  // The sand, dark and cool, with faint ripples and the moon's caustics on it.
  await c.svg(`<defs><linearGradient id="sand" x1="0" y1="${line}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse">${stops([
    [0, '#10225c'],
    [0.3, '#152a63'],
    [1, '#1c336c'],
  ])}</linearGradient></defs><rect y="${line}" width="${W}" height="${H - line}" fill="url(#sand)"/>`, { blur: 1.5 })
  let shadowLines = ''
  let crestLines = ''
  for (let y = line + 6, k = 0; y < H + 20; k++) {
    const depth = (y - line) / (H - line)
    const amp = 2 + depth * 9
    const f = 0.004 + c.between(0, 0.003)
    const phase = c.between(0, 9)
    const at = (x: number, lift: number) => (y + Math.sin(x * f + phase) * amp + Math.sin(x * f * 3.1 + phase) * amp * 0.3 - lift).toFixed(1)
    const width = 0.8 + depth * 3
    let a = ''
    let b = ''
    for (let x = -20; x <= W + 40; x += 24) {
      a += `${x},${at(x, 0)} `
      b += `${x},${at(x, width * 1.4)} `
    }
    shadowLines += `<polyline points="${a}" fill="none" stroke-width="${width}"/>`
    crestLines += `<polyline points="${b}" fill="none" stroke-width="${width * 0.8}"/>`
    y += 5 + depth * depth * 46 + k * 0.2
  }
  await c.shape(shadowLines, '#08154a', { blur: 1.4, opacity: 0.45 })
  await c.shape(crestLines, '#3b5aa8', { blur: 1.2, opacity: 0.3 })
  c.stipple({ x: 0, y: line, w: W, h: H - line }, { per: 0.01, dark: '#06103a', light: '#6f8fe0', darkAlpha: 0.35, lightAlpha: 0.2, r: [0.6, 1.5] })
  net(c, { top: line, bottom: H, near: H, vanish: line - H * 0.05, cell: 230, width: 0.08, colour: '#9db8ff', strength: 0.13, seed: 5, fade: (y) => (y - line) / (H - line) })
  await c.soft(`<rect x="-50" y="${line - H * 0.025}" width="${W + 100}" height="${H * 0.05}"/>`, NIGHT, 14, 0.6)

  // Corals: each glows in its ink, and its polyps glint.
  const sparks: Dot[] = []
  const glints = (coral: Coral, ink: string, count: number) => {
    for (const p of coral.patches) {
      sparks.push(...c.scatter(Math.ceil(count / coral.patches.length), (x, y) => alphaAt(p, x, y) ** 4, () => ({ r: c.between(0.6, 1.5), colour: c.pick([ink, mix(ink, '#ffffff', 0.6), '#ffffff']), alpha: c.between(0.6, 1) }), { x: p.x, y: p.y, w: p.w, h: p.h }))
    }
  }
  const glowing = { water: NIGHT }

  // The far reef: rows of small heads dimming into the dark.
  for (const [foot, size, depth, gap] of [
    [line + 2, H * 0.045, 0.88, 34],
    [line + H * 0.035, H * 0.07, 0.72, 60],
  ] as const) {
    for (let x = -40; x < W + 40; x += c.between(gap, gap * 2.4)) {
      // The nearer row keeps to the sides.
      if (depth < 0.8 && x > W * 0.36 && x < W * 0.64) continue
      const s = size * c.between(0.5, 1.1)
      const o = { ...glowing, colour: c.pick(INKS), depth, glow: 0.22 }
      const kind = c.random()
      const f = foot + c.between(-0.05, 0.1) * s
      if (kind < 0.45) await brain(c, { ...o, x, foot: f, rx: s * c.between(0.8, 1.6), ry: s * c.between(0.55, 0.8) })
      else if (kind < 0.75) await staghorn(c, { ...o, x, foot: f, h: s * 1.3 })
      else await seaFan(c, { ...o, x, foot: f, w: s * 1.3, h: s * 1.5 })
    }
  }

  // Mid-distance clumps either side.
  glints(await brain(c, { ...glowing, x: W * 0.1, foot: H * 0.735, rx: W * 0.055, ry: H * 0.075, colour: BLUE, depth: 0.5, glow: 0.3 }), CYAN, 20)
  glints(await staghorn(c, { ...glowing, x: W * 0.185, foot: H * 0.74, h: H * 0.13, colour: PINK, depth: 0.5, glow: 0.3 }), PINK, 20)
  glints(await seaFan(c, { ...glowing, x: W * 0.84, foot: H * 0.73, w: W * 0.085, h: H * 0.19, colour: VIOLET, depth: 0.5, glow: 0.3 }), VIOLET, 20)
  glints(await brain(c, { ...glowing, x: W * 0.9, foot: H * 0.735, rx: W * 0.05, ry: H * 0.065, colour: GREEN, depth: 0.48, glow: 0.3 }), GREEN, 20)

  // The bommie, a little left of centre, glowing like a lantern.
  const bx = W * 0.47
  const bf = H * 0.77
  await c.svg(halo(bx, bf - H * 0.12, W * 0.2, '#3f6cff', 0.3))
  glints(await seaFan(c, { ...glowing, x: bx + W * 0.03, foot: bf - H * 0.16, w: W * 0.1, h: H * 0.2, colour: VIOLET, depth: 0.34, glow: 0.35 }), VIOLET, 30)
  glints(await brain(c, { ...glowing, x: bx - W * 0.07, foot: bf, rx: W * 0.07, ry: H * 0.12, colour: BLUE, depth: 0.32, glow: 0.35 }), CYAN, 40)
  glints(await brain(c, { ...glowing, x: bx + W * 0.005, foot: bf + 4, rx: W * 0.08, ry: H * 0.16, colour: GREEN, depth: 0.3, glow: 0.35 }), GREEN, 60)
  glints(await brain(c, { ...glowing, x: bx + W * 0.075, foot: bf + 8, rx: W * 0.058, ry: H * 0.095, colour: PINK, depth: 0.3, glow: 0.35 }), PINK, 40)
  glints(await plates(c, { ...glowing, x: bx + W * 0.115, foot: bf, w: W * 0.11, h: H * 0.1, colour: CYAN, depth: 0.3, tiers: 3, root: -1, eye: line, glow: 0.3 }), CYAN, 40)
  glints(await staghorn(c, { ...glowing, x: bx - W * 0.03, foot: bf - H * 0.13, h: H * 0.13, colour: PINK, depth: 0.3, glow: 0.35 }), PINK, 40)

  // In front, cropping in at the edges: on the left a pink fan behind a
  // green head and staghorn in the brand blue; on the right a blue fan, a
  // violet head with green plates off it, and pink staghorn.
  glints(await seaFan(c, { ...glowing, x: W * 0.12, foot: H * 0.88, w: W * 0.22, h: H * 0.5, colour: PINK, depth: 0.1, glow: 0.4 }), PINK, 90)
  glints(await staghorn(c, { ...glowing, x: W * 0.25, foot: H * 1.03, h: H * 0.36, colour: BLUE, depth: 0.05, spread: 1.15, glow: 0.45 }), CYAN, 90)
  glints(await brain(c, { ...glowing, x: W * 0.03, foot: H * 1.07, rx: W * 0.18, ry: H * 0.33, colour: GREEN, depth: 0.16, glow: 0.4 }), GREEN, 120)
  glints(await seaFan(c, { ...glowing, x: W * 0.86, foot: H * 0.83, w: W * 0.16, h: H * 0.42, colour: BLUE, depth: 0.12, glow: 0.45 }), CYAN, 80)
  glints(await brain(c, { ...glowing, x: W * 1.0, foot: H * 1.08, rx: W * 0.15, ry: H * 0.42, colour: VIOLET, depth: 0.02, glow: 0.4 }), VIOLET, 100)
  glints(await plates(c, { ...glowing, x: W * 0.9, foot: H * 1.0, w: W * 0.2, h: H * 0.3, colour: GREEN, depth: 0, tiers: 6, root: 1, eye: line, glow: 0.35 }), GREEN, 120)
  glints(await staghorn(c, { ...glowing, x: W * 0.69, foot: H * 1.03, h: H * 0.28, colour: PINK, depth: 0, spread: 1.35, glow: 0.45 }), PINK, 90)
  c.dots(sparks)

  // Plankton: veils of it drifting as dot screens, and loose specks everywhere.
  const plankton = [
    ...(await veil(c, { from: [-W * 0.05, H * 0.6], via: [W * 0.5, H * 0.46], to: [W * 1.05, H * 0.58], width: H * 0.04, pitch: 10, wave: H * 0.035 })),
    ...(await veil(c, { from: [-W * 0.05, H * 0.1], via: [W * 0.16, H * 0.34], to: [W * 0.34, H * 0.06], width: H * 0.035, pitch: 12, loose: 0.25 })),
    ...(await veil(c, { from: [W * 0.74, H * 0.03], via: [W * 0.96, H * 0.24], to: [W * 1.06, H * 0.48], width: H * 0.04, pitch: 9 })),
    ...c.scatter(700, (_, y) => (y < line ? 1 : 0.3), () => ({ r: c.between(0.6, 1.5), colour: c.pick(PLANKTON), alpha: c.between(0.25, 0.8) })),
  ]
  c.dots(plankton)

  // The jellies: their own layer, bobbing over the still.
  // Their light stays in the still, so the layer is only the jellies themselves.
  const jellies = new Canvas({ width: W, height: H }, 'glow-reef-jellies')
  for (const j of [
    { x: W * 0.17, y: H * 0.23, w: H * 0.22, a: '#ff7ac8', b: '#ffb45a', tilt: -8 },
    { x: W * 0.79, y: H * 0.18, w: H * 0.17, a: '#7af0ff', b: '#3a7bff', tilt: 9 },
    { x: W * 0.665, y: H * 0.43, w: H * 0.09, a: '#9cff6a', b: '#22c6a0', tilt: -5 },
    { x: W * 0.36, y: H * 0.12, w: H * 0.06, a: '#ff9af0', b: '#a05aff', tilt: 12 },
    { x: W * 0.93, y: H * 0.5, w: H * 0.07, a: '#ffe25a', b: '#ff5a3a', tilt: -12 },
  ]) {
    await c.svg(halo(j.x, j.y, j.w * 1.3, j.a, 0.3) + halo(j.x, j.y - j.w * 0.06, j.w * 0.6, mix(j.a, '#ffffff', 0.4), 0.38))
    await jelly(jellies, j)
  }

  // What twinkles: the brightest plankton, the corals' glints, the moon on the surface.
  const twinkles: Twinkle[] = [...plankton.filter((d) => (d.alpha ?? 1) > 0.75 && c.chance(0.2)), ...sparks.filter(() => c.chance(0.25)), ...moonGlints.filter(() => c.chance(0.25))].map((d) => [d.x / W, d.y / H, Math.min(3, Math.max(1, d.r)) / W, d.colour])
  return {
    motion: { twinkles, sprites: [{ file: 'jellies', x: 0, y: 0, w: 1, motion: 'bob' }] },
    layers: { jellies },
    noise: 15,
  }
}

/**
 * Plankton drifting in a veil along a curve, as a dot screen: dots on a
 * square grid `pitch` apart, larger and brighter where the veil is thick,
 * so it reads as the logo's dot matrix lit up. `loose` shakes them off the
 * grid by up to that much of a pitch, `wave` swings the veil up and down
 * along its length. A faint glow runs under it.
 */
async function veil(c: Canvas, { from, via, to, width, pitch, loose = 0, wave = 0 }: { from: [number, number]; via: [number, number]; to: [number, number]; width: number; pitch: number; loose?: number; wave?: number }) {
  const curve: Array<[number, number]> = []
  const swell = c.between(0, 9)
  for (let i = 0; i <= 160; i++) {
    const t = i / 160
    curve.push([(1 - t) ** 2 * from[0] + 2 * (1 - t) * t * via[0] + t * t * to[0], (1 - t) ** 2 * from[1] + 2 * (1 - t) * t * via[1] + t * t * to[1] + wave * Math.sin(t * Math.PI * 3 + swell)])
  }
  await c.soft(`<polyline points="${curve.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}" fill="none" stroke="#000" stroke-width="${width * 1.6}"/>`, '#3f7bff', width * 0.6, 0.12)
  const xs = curve.map(([x]) => x)
  const ys = curve.map(([, y]) => y)
  const x0 = Math.max(0, Math.min(...xs) - width * 2.5)
  const x1 = Math.min(c.W, Math.max(...xs) + width * 2.5)
  const y0 = Math.max(0, Math.min(...ys) - width * 2.5)
  const y1 = Math.min(c.H, Math.max(...ys) + width * 2.5)
  const phase = c.between(0, 9)
  const dots: Dot[] = []
  for (let gy = Math.ceil(y0 / pitch) * pitch; gy < y1; gy += pitch) {
    for (let gx = Math.ceil(x0 / pitch) * pitch; gx < x1; gx += pitch) {
      let best = Infinity
      let along = 0
      for (let i = 0; i < curve.length; i++) {
        const d = (curve[i][0] - gx) ** 2 + (curve[i][1] - gy) ** 2
        if (d < best) {
          best = d
          along = i / 160
        }
      }
      // Thickest along the middle of the veil, in swells along its length.
      const f = Math.exp(-best / (width * width)) * (0.6 + 0.4 * Math.sin(along * 11 + phase)) * (0.7 + 0.3 * Math.sin(gx * 0.011 + gy * 0.017 + phase))
      if (f < 0.04 || c.random() > f * 1.3) continue
      dots.push({ x: gx + c.between(-loose, loose) * pitch, y: gy + c.between(-loose, loose) * pitch, r: pitch * (0.08 + 0.2 * f), colour: c.pick(PLANKTON), alpha: 0.3 + 0.65 * f })
    }
  }
  return dots
}

/**
 * A jelly lit from inside, after the DVD menu's: a bell glowing brightest at
 * its core and thinning to a crisp pale rim, four gonads ringed inside it,
 * frilled oral arms and fine tentacles trailing and fading below (its
 * halo of light is painted on the still). `a` is its light, `b` its
 * margin; (x, y) is the bell's centre, `w` its width, `tilt` its lean in
 * degrees.
 */
async function jelly(c: Canvas, { x, y, w, a, b, tilt }: { x: number; y: number; w: number; a: string; b: string; tilt: number }) {
  const hb = w * 0.64
  const top = y - hb * 0.55
  const rim = y + hb * 0.3
  const turn = (inner: string) => `<g transform="rotate(${tilt} ${x} ${y})">${inner}</g>`
  const spin = (px: number, py: number): [number, number] => {
    const r = (tilt * Math.PI) / 180
    return [x + (px - x) * Math.cos(r) - (py - y) * Math.sin(r), y + (px - x) * Math.sin(r) + (py - y) * Math.cos(r)]
  }
  const box = { x: x - w * 1.3, y: top - w * 0.3, w: w * 2.6, h: hb * 4.4 + w * 0.3 }
  // Tentacles, fine and trailing, fading as they go.
  let tentacles = ''
  for (let i = 0; i < 18; i++) {
    const u = (i + 0.5) / 18
    const sx = x - w / 2 + u * w
    const sy = rim + hb * 0.08 * Math.sin(Math.PI * u)
    const len = hb * c.between(1.8, 3.6)
    const phase = c.between(0, 9)
    const sway = c.between(-0.1, 0.1)
    let d = `M${sx.toFixed(1)} ${sy.toFixed(1)}`
    for (let t = 0.04; t <= 1.001; t += 0.04) d += ` L${(sx + (u - 0.5) * w * 0.3 * t + Math.sin(t * 8 + phase) * w * 0.04 * t + sway * len * t).toFixed(1)} ${(sy + len * t).toFixed(1)}`
    tentacles += `<path d="${d}" fill="none" stroke-width="${Math.max(1, w * 0.007).toFixed(1)}" stroke-linecap="round"/>`
  }
  const trail = await patch(turn(tentacles), box, 0.8)
  fadePatch(trail, (_, py) => 1 - (py - rim) / (hb * 3.4))
  lay(c, trail, flat(mix(a, '#ffffff', 0.35)), () => 0, 0.8)
  // Oral arms: four frilled ribbons from under the bell.
  let arms = ''
  for (let i = 0; i < 4; i++) {
    const sx = x + (i - 1.5) * w * 0.06
    const len = hb * c.between(1.2, 1.8)
    const phase = c.between(0, 9)
    let d = `M${sx.toFixed(1)} ${(rim - hb * 0.15).toFixed(1)}`
    for (let t = 0.04; t <= 1.001; t += 0.04) d += ` L${(sx + Math.sin(t * 6 + phase) * w * 0.05 * t + (i - 1.5) * w * 0.05 * t + Math.sin(t * 31 + phase) * w * 0.008).toFixed(1)} ${(rim - hb * 0.15 + len * t).toFixed(1)}`
    arms += `<path d="${d}" fill="none" stroke-width="${(w * 0.045).toFixed(1)}" stroke-linecap="round"/>`
  }
  const frills = await patch(turn(arms), box, 1.4)
  fadePatch(frills, (_, py) => 1 - (py - rim) / (hb * 1.9))
  lay(c, frills, [rgbOf(mix(b, '#ffffff', 0.45)), rgbOf(b), rgbOf(mix(b, NIGHT, 0.4))], (px) => Math.min(1, Math.abs(px - x) / (w * 0.25)), 0.6)
  // The bell: a dome over a scalloped margin, its front edge bowed down.
  const dome = `M${x - w / 2} ${rim} C ${x - w * 0.53} ${top + hb * 0.3}, ${x - w * 0.32} ${top}, ${x} ${top} C ${x + w * 0.32} ${top}, ${x + w * 0.53} ${top + hb * 0.3}, ${x + w / 2} ${rim}`
  const lobes = 12
  const sag = (u: number) => hb * 0.1 * Math.sin(Math.PI * u)
  let margin = ''
  const marks: Array<[number, number]> = []
  for (let k = lobes; k > 0; k--) {
    const u0 = (k - 1) / lobes
    const um = (k - 0.5) / lobes
    margin += ` Q ${(x - w / 2 + um * w).toFixed(1)} ${(rim + sag(um) + hb * 0.07).toFixed(1)} ${(x - w / 2 + u0 * w).toFixed(1)} ${(rim + sag(u0)).toFixed(1)}`
    marks.push(spin(x - w / 2 + um * w, rim + sag(um) + hb * 0.035))
  }
  const bell = await patch(turn(`<path d="${dome}${margin} Z"/>`), box, 1.2)
  // Brightest at its core, deepening towards the margin; nearly opaque, so
  // the layer's spray stays at its edge, with the arms showing faintly through.
  const core = spin(x, top + hb * 0.4)
  const from = (px: number, py: number) => Math.min(1, Math.hypot((px - core[0]) / (w * 0.5), (py - core[1]) / (hb * 0.75)))
  fadePatch(bell, (px, py) => 1 - 0.12 * from(px, py))
  lay(c, bell, [rgbOf(mix(a, '#ffffff', 0.72)), rgbOf(a), rgbOf(mix(a, b, 0.6))], (px, py) => from(px, py) * 0.92)
  lay(c, frills, flat(mix(b, '#ffffff', 0.3)), () => 0, 0.2)
  // Four gonads in a cross inside the bell, seen from the side, so the loops lie flat.
  let gonads = ''
  for (let k = 0; k < 4; k++) {
    const th = Math.PI / 4 + (k * Math.PI) / 2
    gonads += `<ellipse cx="${(x + Math.cos(th) * w * 0.13).toFixed(1)}" cy="${(top + hb * 0.5 + Math.sin(th) * w * 0.045).toFixed(1)}" rx="${(w * 0.075).toFixed(1)}" ry="${(w * 0.026).toFixed(1)}" fill="none" stroke-width="${(w * 0.016).toFixed(1)}"/>`
  }
  lay(c, await patch(turn(gonads), box, Math.max(1.2, w * 0.01)), flat(mix(a, '#ffffff', 0.55)), () => 0, 0.42)
  // A crisp, pale rim over the dome and round the margin.
  lay(c, await patch(turn(`<path d="${dome}" fill="none" stroke-width="${Math.max(1.2, w * 0.012).toFixed(1)}"/>`), box, 0.7), flat(mix(a, '#ffffff', 0.8)), () => 0, 0.9)
  lay(c, await patch(turn(`<path d="M${x + w / 2} ${rim}${margin}" fill="none" stroke-width="${Math.max(1, w * 0.008).toFixed(1)}"/>`), box, 0.7), flat(mix(b, '#ffffff', 0.5)), () => 0, 0.8)
  c.dots(marks.map(([mx, my]) => ({ x: mx, y: my, r: Math.max(1, w * 0.008), colour: '#ffffff', alpha: 0.9 })))
}
