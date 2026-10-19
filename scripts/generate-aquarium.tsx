/**
 * Paints the aquarium: one airbrushed scene of water, light, coral and fish,
 * the background the homepage's text sits over (/prototypes/aquarium).
 *
 * Two compositions, the same tank: public/aquarium/wide.webp (landscape, for
 * desktop) and public/aquarium/tall.webp (portrait, for phones). Everything is
 * drawn by the airbrush renderer (scripts/airbrush.ts) from the flora's coral
 * families (src/lib/flora.ts) and the fish (src/lib/fish.ts), then the whole
 * tank is grained once so it reads as one sprayed surface.
 *
 * The middle of each composition is kept to small fish and open water, since
 * the text panel sits there; the big fish and the tallest corals frame it.
 *
 * With --preview it also writes half-size PNGs to .context/ to look at.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

import { hashString, mulberry32 } from '../src/lib/dither'
import { drawFish, FISH_BOX, type Species } from '../src/lib/fish'
import { AIR_COLOURS, drawFlora, type Family, FLORA_SIZE, ROLES } from '../src/lib/flora'
import { airbrush, blank, grain, type Image, over, paint, type Size, softAlpha, toWebp } from './airbrush'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT_DIR = path.join(ROOT, 'public', 'aquarium')

type Composition = { name: string; size: Size; corals: number; fish: number }

const COMPOSITIONS: Composition[] = [
  { name: 'wide', size: { width: 2400, height: 1350 }, corals: 17, fish: 15 },
  { name: 'tall', size: { width: 1200, height: 2100 }, corals: 10, fish: 11 },
]

/** Reef colours: saturated, like the aquarium references, rather than the flora's pastels. */
const REEF = ['#ff5a6e', '#ff8a2b', '#ff3fa4', '#b6f03a', '#ffd23a', '#8a5bff', '#2fd3e0', '#ff9ec4', '#ffffff', '#5b8bff']

const CORAL_FAMILIES: Family[] = ['branch', 'fan', 'puff', 'frond', 'bell', 'shelf', 'branch', 'puff', 'branch']
const SPECIES_MIX: Species[] = ['clown', 'tang', 'butterfly', 'angel', 'idol', 'clown', 'tang', 'butterfly', 'angel', 'clown']

async function main() {
  const preview = process.argv.includes('--preview')
  await mkdir(OUT_DIR, { recursive: true })
  for (const composition of COMPOSITIONS) {
    const image = await paintTank(composition)
    const rgba = grain(image, { noise: 18, edge: 0 })
    const webp = await toWebp(rgba, composition.size, 78)
    await writeFile(path.join(OUT_DIR, `${composition.name}.webp`), webp)
    if (preview) {
      await mkdir(path.join(ROOT, '.context'), { recursive: true })
      await sharp(Buffer.from(rgba.buffer), { raw: { ...composition.size, channels: 4 } })
        .resize(Math.round(composition.size.width / 2))
        .png()
        .toFile(path.join(ROOT, '.context', `aquarium-${composition.name}.png`))
    }
    console.log(`[aquarium] ${composition.name}: ${(webp.length / 1024).toFixed(0)}kB`)
  }
}

async function paintTank({ name, size, corals, fish }: Composition): Promise<Image> {
  const random = mulberry32(hashString(`aquarium-${name}`))
  const between = (lo: number, hi: number) => lo + random() * (hi - lo)
  const { width: W, height: H } = size
  const tank = blank(size)
  const unit = Math.min(W, H)

  // Water: a luminous blue, paling towards a warm sand bed.
  await layer(tank, `<defs><linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f7cff"/><stop offset="0.38" stop-color="#6fb3ff"/><stop offset="0.72" stop-color="#a9e2ff"/><stop offset="0.9" stop-color="#d9f4ff"/><stop offset="1" stop-color="#ffe6d2"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#w)"/>`, size, 0)

  // Washes: big soft blooms of lighter and deeper water, like wet-in-wet paint.
  for (let i = 0; i < 14; i++) {
    const colour = ['#ffffff', '#8fd8ff', '#3a6cf0', '#c9b6ff', '#ffc4dc'][i % 5]
    const r = unit * between(0.12, 0.3)
    paint(tank, await softBig(`<circle cx="${between(0, W)}" cy="${between(0, H * 0.8)}" r="${r}" fill="#000"/>`, size, r * 0.45), colour, between(0.1, 0.22))
  }

  // Light from above: soft wedges fanning down from the surface.
  for (let i = 0; i < 7; i++) {
    const x = between(-0.1, 1.1) * W
    const spread = between(0.04, 0.1) * W
    const lean = between(-0.25, 0.25) * W
    const d = `M${x - spread * 0.3} 0 L${x + spread * 0.3} 0 L${x + lean + spread} ${H * 0.95} L${x + lean - spread} ${H * 0.95} Z`
    paint(tank, await softBig(`<path d="${d}" fill="#000"/>`, size, unit * 0.07), '#ffffff', between(0.07, 0.14))
  }

  // Corals along the bed: the tallest at the sides, framing the middle.
  const slots = Array.from({ length: corals }, (_, i) => (i + between(0.1, 0.9)) / corals)
  const coralLayers: Array<{ x: number; image: Image; far: boolean; colour: string }> = []
  for (const [i, t] of slots.entries()) {
    const edge = Math.abs(t - 0.5) * 2
    const family = CORAL_FAMILIES[Math.floor(random() * CORAL_FAMILIES.length)]
    const drawing = drawFlora(`${family}-tank-${name}-${i}`, family)
    // Portrait tanks are tall, so their reef rises further up the glass.
    const reach = W > H ? unit : H * 0.62
    const heightPx = reach * (0.34 + edge * edge * 0.5) * between(0.85, 1.15)
    const w = Math.round((heightPx * FLORA_SIZE.width) / FLORA_SIZE.height)
    const h = Math.round(heightPx)
    const pick = () => REEF[Math.floor(random() * REEF.length)]
    const body = pick()
    const colours = Object.fromEntries(ROLES.map((role) => [role, role === 'body' ? body : role === 'stem' || role === 'base' ? AIR_COLOURS[drawing.air[role]] : pick()]))
    const image = await airbrush(drawing.layers, colours, { width: w, height: h }, FLORA_SIZE, { scale: w / 240, flip: random() < 0.5 })
    coralLayers.push({ x: t * W - w / 2, image, far: i % 3 === 1, colour: body })
  }
  // Far corals first, paler; then the near ones over them.
  for (const c of coralLayers.filter((c) => c.far)) over(tank, c.image, c.x, H - c.image.size.height * 0.96 - unit * 0.03, 0.62)

  // Fish: big ones round the edges, the middle left to open water and small fry.
  const placed: Array<{ x: number; y: number; w: number }> = []
  const fishImages: Array<{ x: number; y: number; image: Image; far: boolean; colour: string }> = []
  for (let i = 0; i < fish; i++) {
    const species = SPECIES_MIX[i % SPECIES_MIX.length]
    let tries = 0
    let x = 0
    let y = 0
    let w = 0
    do {
      w = unit * between(0.16, 0.32)
      x = between(0.02, 0.98) * W - w / 2
      y = between(0.06, 0.66) * H
      const cx = (x + w / 2) / W
      const cy = y / H
      // Keep the middle (where the text sits) for small fish only.
      const middle = cx > 0.3 && cx < 0.7 && cy > 0.18 && cy < 0.78
      if (middle) w *= 0.6
      tries++
      if (!placed.some((p) => Math.hypot(p.x - x, p.y - y) < (p.w + w) * 0.6)) break
    } while (tries < 40)
    placed.push({ x, y, w })
    const drawing = drawFish(species, `${name}-${i}`)
    const h = Math.round((w * FISH_BOX.height) / FISH_BOX.width)
    const image = await airbrush(drawing.layers, drawing.colours, { width: Math.round(w), height: h }, FISH_BOX, { scale: w / 210, flip: random() < 0.5 })
    fishImages.push({ x, y, image, far: w < unit * 0.13, colour: drawing.colours.body ?? '#ffffff' })
  }
  // A soft glow behind each big fish, as if the tank light catches it.
  for (const f of fishImages.filter((f) => !f.far)) {
    const { width: fw, height: fh } = f.image.size
    paint(tank, await softBig(`<ellipse cx="${f.x + fw / 2}" cy="${f.y + fh / 2}" rx="${fw * 0.6}" ry="${fh * 0.55}" fill="#000"/>`, size, fw * 0.3), '#ffffff', 0.16)
  }
  for (const f of fishImages.filter((f) => f.far)) over(tank, f.image, f.x, f.y, 0.8)

  // A school of neon tetras crossing one side.
  const school = { x: between(0.08, 0.22) * W, y: between(0.12, 0.3) * H, flip: random() < 0.5 }
  for (let i = 0; i < 7; i++) {
    const w = unit * between(0.045, 0.06)
    const drawing = drawFish('tetra', `${name}-school-${i}`)
    const image = await airbrush(drawing.layers, drawing.colours, { width: Math.round(w), height: Math.round((w * 140) / 200) }, FISH_BOX, { scale: w / 260, flip: school.flip })
    over(tank, image, school.x + (i % 4) * w * 1.1 + between(-8, 8), school.y + Math.floor(i / 4) * w * 0.6 + (i % 2) * w * 0.3, 0.92)
  }

  for (const c of coralLayers.filter((c) => !c.far)) over(tank, c.image, c.x, H - c.image.size.height * 0.94)

  // Spray: flecks of reef colour flung up round the corals, as an airbrush leaves.
  const flecks = new Map<string, string>()
  for (const c of coralLayers) {
    const { width: cw, height: ch } = c.image.size
    for (let i = 0; i < 16; i++) {
      const colour = random() < 0.7 ? c.colour : REEF[Math.floor(random() * REEF.length)]
      // Flecks crowd the coral's crown and thin out above it.
      const fx = c.x + between(0, 1) * cw
      const fy = H - ch * (0.8 + between(0, 0.45) ** 2)
      const r = unit * between(0.0015, 0.006)
      flecks.set(colour, (flecks.get(colour) ?? '') + `<circle cx="${fx}" cy="${fy}" r="${r}" fill="#000"/>`)
    }
  }
  for (const [colour, circles] of flecks) paint(tank, await softAlpha(svgOf(size, circles), size, 1.4), colour, 0.85)
  for (const f of fishImages.filter((f) => !f.far)) over(tank, f.image, f.x, f.y)

  // Bubbles rising: soft rings with a bright catch-light.
  let bubbles = ''
  for (let i = 0; i < 26; i++) {
    const column = [0.14, 0.86, 0.5][i % 3] * W + between(-40, 40)
    const r = unit * between(0.004, 0.014)
    const cy = between(0.02, 0.85) * H
    bubbles += `<circle cx="${column}" cy="${cy}" r="${r}" fill="none" stroke="#000" stroke-width="${Math.max(1.5, r * 0.18)}"/><circle cx="${column - r * 0.35}" cy="${cy - r * 0.35}" r="${r * 0.22}" fill="#000"/>`
  }
  paint(tank, await softAlpha(svgOf(size, bubbles), size, 1.2), '#ffffff', 0.75)

  return tank
}

function svgOf({ width, height }: Size, inner: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${inner}</svg>`
}

/**
 * A very soft shape: drawn and blurred at a fraction of full size, then
 * scaled up. A wide blur at full size would take minutes and look the same.
 */
async function softBig(inner: string, size: Size, sigma: number) {
  const factor = Math.max(1, Math.floor(sigma / 6))
  const small = { width: Math.ceil(size.width / factor), height: Math.ceil(size.height / factor) }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${small.width}" height="${small.height}" viewBox="0 0 ${size.width} ${size.height}">${inner}</svg>`
  const raw = await sharp(Buffer.from(svg)).ensureAlpha().extractChannel(3).raw().toBuffer()
  const blurred = await sharp(raw, { raw: { ...small, channels: 1 } })
    .blur(Math.max(0.3, sigma / factor))
    .resize(size.width, size.height, { kernel: 'cubic' })
    .extractChannel(0)
    .raw()
    .toBuffer()
  return Float32Array.from(blurred, (v) => v / 255)
}

/** Paints a full-colour SVG straight in (for the water's gradient). */
async function layer(out: Image, inner: string, size: Size, blur: number) {
  let pipeline = sharp(Buffer.from(svgOf(size, inner))).ensureAlpha()
  if (blur) pipeline = pipeline.blur(blur)
  const raw = await pipeline.raw().toBuffer()
  for (let i = 0; i < size.width * size.height; i++) {
    const o = i * 4
    const a = raw[o + 3] / 255
    const below = out.data[o + 3]
    const total = a + below * (1 - a)
    if (total <= 0) continue
    for (let k = 0; k < 3; k++) out.data[o + k] = (raw[o + k] * a + out.data[o + k] * below * (1 - a)) / total
    out.data[o + 3] = total
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
