/**
 * Paints the props for the sea page (/prototypes/sea) in watercolour
 * (scripts/airbrush.ts), after the striped-sail watercolour and the Life
 * Aquatic poster: muted teal water, mustard, navy, coral and cream, on paper.
 *
 * Each prop is its own transparent image in public/sea/, so the page can
 * place, layer and later animate them over one continuous CSS gradient:
 *   sailboat, submarine, surface (the torn-paper waterline), seabed,
 *   cloud-<n>, fish-<n>, coral-<n>, and paper.webp (a cold-press tile).
 *
 * With --preview it also writes .context/sea-props.png, every prop on one sheet.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp, { type OverlayOptions } from 'sharp'

import { hashString, mulberry32 } from '../src/lib/dither'
import { drawFish, FISH_BOX, type Species } from '../src/lib/fish'
import { drawFlora, type Family, FLORA_SIZE, type Role, ROLES } from '../src/lib/flora'
import { grain, type Image, type Part, toWebp, watercolour } from './airbrush'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT_DIR = path.join(ROOT, 'public', 'sea')

/** The sea page's palette. Teals match the CSS gradient in sea.css. */
const SEA = {
  paper: '#f3eee3',
  cream: '#f6f1e3',
  surface: '#8cbcc1',
  teal: '#6fa3ab',
  deep: '#4f8494',
  mustard: '#e8b630',
  yellow: '#efcf3f',
  navy: '#34465c',
  hull: '#5f7488',
  hullDark: '#3f5368',
  coral: '#e07a5f',
  rose: '#d99a92',
  rust: '#c8553d',
  sand: '#d9c6a0',
  weed: '#5f8f6b',
  pencil: '#8f8a80',
  wood: '#6b4f3f',
  grey: '#8b8f94',
  ink: '#2f2f2f',
}

/** The fish's bright colours, muted to the poster's. */
const MUTE: Record<string, string> = {
  '#ff7a3d': SEA.coral,
  '#ff9a5a': '#e8957a',
  '#ffd84a': SEA.mustard,
  '#ffe9a0': '#efdca0',
  '#3f6dff': '#4f6fa8',
  '#ffe14d': '#e8c54a',
  '#fff3b0': '#f1e6bd',
  '#ff8a4c': '#d98245',
  '#2a3478': SEA.navy,
  '#23306b': SEA.navy,
  '#fff8ec': SEA.cream,
  '#9fd0ff': '#a9cfd3',
  '#d7ecff': '#d6e6e4',
  '#ff3d6e': SEA.rust,
}

type Prop = { name: string; image: Image }

const svgPath = (d: string) => `<path d="${d}"/>`
const line = (d: string, w: number) => `<path d="${d}" fill="none" stroke="#000" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`

async function main() {
  const preview = process.argv.includes('--preview')
  await mkdir(OUT_DIR, { recursive: true })
  const props: Prop[] = [
    { name: 'sailboat', image: await sailboat() },
    { name: 'submarine', image: await submarine() },
    { name: 'surface', image: await waterline('surface') },
    { name: 'seabed', image: await waterline('seabed') },
    ...(await clouds()),
    ...(await fishes()),
    ...(await corals()),
  ]
  let bytes = 0
  for (const prop of props) {
    const webp = await toWebp(grain(prop.image, { noise: 8, edge: 0.25, seed: hashString(prop.name) }), prop.image.size, 84)
    await writeFile(path.join(OUT_DIR, `${prop.name}.webp`), webp)
    bytes += webp.length
  }
  bytes += await paper()
  if (preview) await sheet(props)
  console.log(`[sea] ${props.length + 1} images, ${(bytes / 1024).toFixed(0)}kB total`)
}

/** After the striped-sail watercolour: navy hull, white jib, mustard-banded main, a little flag. */
async function sailboat() {
  const box = { width: 240, height: 320 }
  const hull = 'M18 262 L224 262 Q216 296 190 308 L58 308 Q30 298 18 262 Z'
  const main = 'M125 44 Q194 118 216 254 L125 250 Z'
  let bands = ''
  for (let i = 0; i < 6; i++) {
    const y = 74 + i * 30
    bands += `<path d="M110 ${y} L230 ${y + 6} L230 ${y + 22} L110 ${y + 17} Z"/>`
  }
  const parts: Part[] = [
    { shapes: [svgPath(hull)], colour: SEA.hullDark },
    { shapes: [svgPath('M18 262 L224 262 L219 278 L24 278 Z')], colour: SEA.hull },
    { shapes: [line('M26 282 L218 282', 2.2)], colour: SEA.cream, opacity: 0.95 },
    { shapes: [svgPath('M70 262 Q98 246 150 246 L174 262 Z')], colour: '#ece8df' },
    { shapes: [line('M104 254 L112 254 M122 254 L130 254 M140 254 L148 254', 2.6)], colour: SEA.grey },
    { shapes: [svgPath('M117 40 L29 252 L117 238 Z')], colour: '#f8f5ef', opacity: 0.85 },
    { shapes: [line('M117 40 L29 252 L117 238', 1.1)], colour: SEA.pencil, opacity: 0.8 },
    { shapes: [svgPath(main)], colour: '#f8f5ef', opacity: 0.85 },
    { shapes: [`<clipPath id="m"><path d="${main}"/></clipPath><g clip-path="url(#m)">${bands}</g>`], colour: SEA.mustard },
    { shapes: [line(main.replace(' Z', ''), 1.1)], colour: SEA.pencil, opacity: 0.8 },
    { shapes: [line('M62 238 L120 236', 3)], colour: SEA.grey },
    { shapes: ['<rect x="119" y="26" width="4.5" height="236" rx="2"/>'], colour: SEA.wood },
    { shapes: [svgPath('M123 28 L156 36 L123 48 Z')], colour: SEA.navy },
    // Little ripples where the hull meets the water.
    { shapes: [line('M8 314 Q30 309 52 314 M190 313 Q212 308 234 313', 2)], colour: SEA.cream, opacity: 0.8 },
  ]
  return watercolour(parts, { width: 480, height: 640 }, box, { scale: 2, seed: 11 })
}

/** After the Life Aquatic poster: a yellow submarine with portholes and a dark band, its lamp on. */
async function submarine() {
  const box = { width: 520, height: 260 }
  const body = 'M70 132 C70 84 150 64 258 64 C366 64 424 88 444 132 C424 176 366 196 258 196 C150 196 70 178 70 132 Z'
  const parts: Part[] = [
    // The lamp's beam, a pale wash ahead of the nose.
    { shapes: [svgPath('M74 124 L0 92 L0 172 L74 140 Z')], colour: SEA.cream, opacity: 0.55 },
    { shapes: ['<rect x="130" y="192" width="250" height="20" rx="10"/>'], colour: '#e3be33' },
    { shapes: [svgPath('M436 132 L506 70 L498 196 Z')], colour: SEA.yellow },
    { shapes: [svgPath(body)], colour: SEA.yellow },
    { shapes: ['<rect x="214" y="30" width="96" height="40" rx="8"/><rect x="236" y="16" width="36" height="18" rx="4"/>'], colour: '#e3be33' },
    { shapes: [`<clipPath id="b"><path d="${body}"/></clipPath><g clip-path="url(#b)"><rect x="60" y="146" width="400" height="11"/></g>`], colour: SEA.ink, opacity: 0.85 },
    { shapes: [line('M150 72 Q146 132 152 190 M330 70 Q336 132 330 192', 1.2)], colour: '#b8962a', opacity: 0.7 },
    { shapes: ['<circle cx="196" cy="118" r="25"/><circle cx="276" cy="118" r="25"/>'], colour: SEA.cream },
    { shapes: ['<circle cx="196" cy="118" r="17"/><circle cx="276" cy="118" r="17"/>'], colour: '#9fb3a6' },
    { shapes: ['<circle cx="190" cy="112" r="5"/><circle cx="270" cy="112" r="5"/>'], colour: '#f8f5ef', opacity: 0.8 },
    { shapes: [svgPath('M446 120 L462 98 L470 104 L456 126 Z M446 144 L462 166 L470 160 L456 138 Z')], colour: SEA.grey },
    { shapes: ['<circle cx="74" cy="132" r="7"/>'], colour: SEA.cream },
  ]
  return watercolour(parts, { width: 1040, height: 520 }, box, { scale: 2, seed: 23 })
}

/**
 * A torn-paper edge across the full width, after the poster's waterline: the
 * paper's white core shows along the tear, then solid colour below. The
 * surface is teal (the top of the water); the seabed is sand.
 */
async function waterline(kind: 'surface' | 'seabed') {
  const size = { width: 2400, height: kind === 'surface' ? 220 : 280 }
  const random = mulberry32(hashString(kind))
  const base = kind === 'surface' ? 70 : 110
  let top = ''
  let rim = ''
  for (let x = 0; x <= size.width; x += 6) {
    const y = base + 20 * Math.sin(x / 190 + 0.8) + 9 * Math.sin(x / 61) + (kind === 'seabed' ? 34 * Math.sin(x / 520) : 0) + (random() - 0.5) * 3.4
    top += `${x === 0 ? 'M' : 'L'}${x} ${y.toFixed(1)} `
    rim += `${x === 0 ? 'M' : 'L'}${x} ${(y - 3 - random() * 3).toFixed(1)} `
  }
  const fill = (edge: string) => `<path d="${edge} L${size.width} ${size.height} L0 ${size.height} Z"/>`
  const parts: Part[] = [
    { shapes: [fill(rim)], colour: '#fbf8f1', opacity: 0.95 },
    { shapes: [fill(top)], colour: kind === 'surface' ? SEA.surface : SEA.sand, opacity: 1 },
  ]
  if (kind === 'seabed') {
    let pebbles = ''
    for (let i = 0; i < 70; i++) pebbles += `<ellipse cx="${(random() * size.width).toFixed(0)}" cy="${(base + 60 + random() * 150).toFixed(0)}" rx="${(3 + random() * 7).toFixed(1)}" ry="${(2 + random() * 4).toFixed(1)}"/>`
    parts.push({ shapes: [pebbles], colour: '#bfa985', opacity: 0.8 })
  }
  return watercolour(parts, size, size, { scale: 1.4, seed: hashString(kind) })
}

async function clouds(): Promise<Prop[]> {
  const out: Prop[] = []
  for (let i = 1; i <= 2; i++) {
    const random = mulberry32(hashString(`cloud-${i}`))
    let blobs = ''
    for (let j = 0; j < 6; j++) blobs += `<ellipse cx="${60 + j * 48 + random() * 20}" cy="${70 + random() * 24 - (j > 1 && j < 4 ? 20 : 0)}" rx="${40 + random() * 26}" ry="${26 + random() * 16}"/>`
    const box = { width: 380, height: 150 }
    out.push({ name: `cloud-${i}`, image: await watercolour([{ shapes: [blobs], colour: '#dfe8e6', opacity: 0.75 }], { width: 760, height: 300 }, box, { scale: 2, seed: 40 + i }) })
  }
  return out
}

const FISH_SET: Species[] = ['clown', 'tang', 'butterfly', 'angel', 'tang', 'clown', 'tetra']

async function fishes(): Promise<Prop[]> {
  const out: Prop[] = []
  for (const [i, species] of FISH_SET.entries()) {
    const drawing = drawFish(species, `sea-${i}`)
    const parts = ROLES.flatMap((role) => {
      const shapes = drawing.layers[role]
      const colour = drawing.colours[role]
      return shapes?.length && colour ? [{ shapes, colour: MUTE[colour] ?? colour }] : []
    })
    out.push({ name: `fish-${i + 1}`, image: await watercolour(parts, { width: 400, height: 280 }, FISH_BOX, { scale: 1.6, seed: 60 + i }) })
  }
  return out
}

const CORAL_SET: Array<{ family: Family; colours: Partial<Record<Role, string>> }> = [
  { family: 'branch', colours: { base: SEA.sand, body: SEA.coral, shade: '#eb9a82', accent: SEA.rust, spot: SEA.cream } },
  { family: 'fan', colours: { stem: SEA.rose, shade: '#e8c3bb', body: SEA.rose, accent: SEA.rust, spot: SEA.cream } },
  { family: 'branch', colours: { base: SEA.sand, body: SEA.mustard, shade: '#f0cd6c', accent: '#c99a1f', spot: SEA.cream } },
  { family: 'puff', colours: { base: SEA.weed, stem: SEA.weed, body: SEA.rose, shade: SEA.coral, accent: SEA.mustard, spot: SEA.cream } },
]

async function corals(): Promise<Prop[]> {
  const out: Prop[] = []
  for (const [i, { family, colours }] of CORAL_SET.entries()) {
    const drawing = drawFlora(`sea-coral-${i}`, family)
    const parts = ROLES.flatMap((role) => {
      const shapes = drawing.layers[role]
      const colour = colours[role]
      return shapes?.length && colour ? [{ shapes, colour }] : []
    })
    out.push({ name: `coral-${i + 1}`, image: await watercolour(parts, { width: 400, height: 500 }, FLORA_SIZE, { scale: 2.4, seed: 80 + i }) })
  }
  return out
}

/** Cold-press paper: long fibres and pits, as a seamless tile to multiply over the page. */
async function paper() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><filter id="p"><feTurbulence type="fractalNoise" baseFrequency="0.03 0.5" numOctaves="3" seed="4" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.42  0 0 0 0 0.40  0 0 0 0 0.36  0 0 0 1.1 -0.42"/></filter><rect width="512" height="512" filter="url(#p)"/></svg>`
  const webp = await sharp(Buffer.from(svg)).webp({ quality: 80, alphaQuality: 80 }).toBuffer()
  await writeFile(path.join(OUT_DIR, 'paper.webp'), webp)
  return webp.length
}

async function sheet(props: Prop[]) {
  const cell = 420
  const cols = 4
  const rows = Math.ceil(props.length / cols)
  const layers: OverlayOptions[] = []
  for (const [i, prop] of props.entries()) {
    const png = await sharp(Buffer.from(grain(prop.image, { noise: 8, edge: 0.25 }).buffer), { raw: { ...prop.image.size, channels: 4 } })
      .resize(cell - 20, cell - 40, { fit: 'inside' })
      .png()
      .toBuffer()
    layers.push({ input: png, left: (i % cols) * cell + 10, top: Math.floor(i / cols) * cell + 10 })
    layers.push({ input: Buffer.from(`<svg width="${cell}" height="20"><text x="10" y="14" font-size="13" font-family="Helvetica">${prop.name}</text></svg>`), left: (i % cols) * cell, top: Math.floor(i / cols) * cell + cell - 24 })
  }
  await mkdir(path.join(ROOT, '.context'), { recursive: true })
  await sharp({ create: { width: cols * cell, height: rows * cell, channels: 3, background: '#8cbcc1' } })
    .composite(layers)
    .png()
    .toFile(path.join(ROOT, '.context', 'sea-props.png'))
}


main().catch((error) => {
  console.error(error)
  process.exit(1)
})
