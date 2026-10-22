/**
 * Prints the flora (src/lib/flora.ts) two ways:
 *
 * - Riso: 1-bit dithered masks, one per ink role, public/flora/<id>-<role>.png
 *   (black dots on transparent, one image pixel per dot) plus a two-thirds
 *   print of each (<id>-<role>-sm.png). components/flora stacks and colours
 *   them in CSS, in the two-ink or the full palette.
 * - Airbrush: one soft colour image per specimen, public/flora/air/<id>.webp.
 *   Each role is blurred, laid over the last in its pastel, then sprayed with
 *   grain that is heaviest where a shape fades out, after the wildflower
 *   paintings and gradient posters on Marc's board.
 *
 * Also writes src/lib/flora.generated.json (each specimen's roles and inks)
 * and, with --sheet, .context/flora-sheet.png (riso, both palettes) and
 * .context/flora-air-sheet.png (airbrush), for picking.
 *
 * Run via tsx so it shares the drawing and the dither with the browser.
 */
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp, { type OverlayOptions } from 'sharp'

import { ditherToAlpha } from '../src/lib/dither'
import { AIR_COLOURS, drawFlora, FAMILIES, FLORA_SIZE, FLORA_SMALL, type FloraDrawing, type Ink, type Role, ROLES, roleSvg, toneOf } from '../src/lib/flora'
import { airbrush, grain, toWebp } from './airbrush'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT_DIR = path.join(ROOT, 'public', 'flora')
const MANIFEST = path.join(ROOT, 'src', 'lib', 'flora.generated.json')

/** Candidates per family. */
const PER_FAMILY = 6

/** For the contact sheet only; the page takes its inks from CSS tokens. */
const SHEET_INKS: Record<Ink, string> = {
  blue: '#3a5ba0',
  orange: '#ff6c3a',
  pink: '#ff48b0',
  green: '#00a95c',
  yellow: '#ffe14d',
  black: '#1f1f22',
  paper: '#ecebe5',
}
/** The airbrush render, in CSS px: twice the riso bitmap, so the grain is fine. */
const AIR_SIZE = { width: FLORA_SIZE.width * 2, height: FLORA_SIZE.height * 2 }

const TWO_INK: Record<Role, Ink> = { base: 'blue', stem: 'blue', body: 'blue', shade: 'blue', accent: 'orange', line: 'orange', spot: 'paper' }

type Printed = { drawing: FloraDrawing; masks: Partial<Record<Role, Buffer>>; air: Buffer }

async function main() {
  const sheet = process.argv.includes('--sheet')
  await rm(OUT_DIR, { recursive: true, force: true })
  await mkdir(path.join(OUT_DIR, 'air'), { recursive: true })

  const printed: Printed[] = []
  let bytes = 0
  for (const family of FAMILIES) {
    for (let i = 1; i <= PER_FAMILY; i++) {
      const drawing = drawFlora(`${family}-${i}`, family)
      const masks: Partial<Record<Role, Buffer>> = {}
      for (const [index, role] of ROLES.entries()) {
        const shapes = drawing.layers[role]
        if (!shapes?.length) continue
        const above = ROLES.slice(index + 1).flatMap((r) => drawing.layers[r] ?? [])
        const png = await printRole(roleSvg(shapes, toneOf(role), above), FLORA_SIZE)
        const small = await printRole(roleSvg(shapes, toneOf(role), above, FLORA_SMALL), FLORA_SMALL)
        await writeFile(path.join(OUT_DIR, `${drawing.id}-${role}.png`), png)
        await writeFile(path.join(OUT_DIR, `${drawing.id}-${role}-sm.png`), small)
        masks[role] = png
        bytes += png.length + small.length
      }
      const air = await printAirbrush(drawing)
      await writeFile(path.join(OUT_DIR, 'air', `${drawing.id}.webp`), air)
      bytes += air.length
      printed.push({ drawing, masks, air })
    }
  }

  const manifest = printed.map(({ drawing, masks }) => ({
    id: drawing.id,
    family: drawing.family,
    roles: ROLES.filter((r) => masks[r]),
    inks: drawing.inks,
    air: drawing.air,
  }))
  await writeFile(MANIFEST, JSON.stringify(manifest, null, 1) + '\n')
  if (sheet) {
    await contactSheet(printed)
    await airSheet(printed)
  }
  console.log(`[flora] ${printed.length} specimens, ${(bytes / 1024).toFixed(0)}kB total`)
}

/** Rasterizes one role's SVG and dithers its coverage to a 1-bit mask. */
async function printRole(svg: string, { width, height }: { width: number; height: number }) {
  const alpha = await sharp(Buffer.from(svg)).ensureAlpha().extractChannel(3).raw().toBuffer()
  const coverage = Float32Array.from(alpha, (v) => v / 255)
  const rgba = new Uint8ClampedArray(width * height * 4)
  ditherToAlpha(rgba, coverage, width, height)
  return sharp(Buffer.from(rgba.buffer), { raw: { width, height, channels: 4 } })
    .png({ palette: true, colours: 2, compressionLevel: 9 })
    .toBuffer()
}

/** The airbrush render of one specimen (scripts/airbrush.ts), as a webp. */
async function printAirbrush(drawing: FloraDrawing) {
  const colours = Object.fromEntries(ROLES.map((role) => [role, AIR_COLOURS[drawing.air[role]]]))
  const image = await airbrush(drawing.layers, colours, AIR_SIZE, FLORA_SIZE, { scale: AIR_SIZE.width / FLORA_SIZE.width / 2 })
  return toWebp(grain(image), AIR_SIZE)
}

/** Every candidate's airbrush render, on a soft pastel ground like the references. */
async function airSheet(printed: Printed[]) {
  const { width, height } = AIR_SIZE
  const cellW = width + 16
  const cellH = height + 26
  const cols = PER_FAMILY
  const rows = Math.ceil(printed.length / cols)
  const sheetW = cols * cellW
  const sheetH = rows * cellH
  const ground = `<svg xmlns="http://www.w3.org/2000/svg" width="${sheetW}" height="${sheetH}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bcd9ff"/><stop offset="0.45" stop-color="#ffd3e2"/><stop offset="1" stop-color="#d7f0d0"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`
  const layers: OverlayOptions[] = []
  for (const [i, { drawing, air }] of printed.entries()) {
    const left = (i % cols) * cellW + 8
    const top = Math.floor(i / cols) * cellH + 4
    layers.push({ input: air, left, top })
    const label = `<svg width="${cellW}" height="18"><text x="2" y="13" font-size="13" font-family="Helvetica">${drawing.id}</text></svg>`
    layers.push({ input: Buffer.from(label), left, top: top + height + 2 })
  }
  await sharp(Buffer.from(ground)).composite(layers).png().toFile(path.join(ROOT, '.context', 'flora-air-sheet.png'))
}

/** Every candidate, two-ink above full palette, labelled with its id. */
async function contactSheet(printed: Printed[]) {
  const scale = 2
  const { width, height } = FLORA_SIZE
  const cellW = width * scale + 16
  const cellH = (height * scale + 8) * 2 + 20
  const cols = PER_FAMILY
  const rows = Math.ceil(printed.length / cols)
  const layers: OverlayOptions[] = []

  for (const [i, { drawing, masks }] of printed.entries()) {
    const left = (i % cols) * cellW + 8
    const top = Math.floor(i / cols) * cellH + 8
    for (const [p, inks] of [TWO_INK, drawing.inks].entries()) {
      for (const role of ROLES) {
        const mask = masks[role]
        if (!mask) continue
        const tinted = await sharp({ create: { width, height, channels: 4, background: SHEET_INKS[inks[role]] } })
          .composite([{ input: mask, blend: 'dest-in' }])
          .png()
          .toBuffer()
        const big = await sharp(tinted).resize(width * scale, height * scale, { kernel: 'nearest' }).toBuffer()
        layers.push({ input: big, left, top: top + p * (height * scale + 8) })
      }
    }
    const label = `<svg width="${cellW}" height="18"><text x="2" y="13" font-size="13" font-family="Helvetica">${drawing.id}</text></svg>`
    layers.push({ input: Buffer.from(label), left, top: top + 2 * (height * scale + 8) - 4 })
  }

  await mkdir(path.join(ROOT, '.context'), { recursive: true })
  await sharp({ create: { width: cols * cellW, height: rows * cellH, channels: 3, background: SHEET_INKS.paper } })
    .composite(layers)
    .png()
    .toFile(path.join(ROOT, '.context', 'flora-sheet.png'))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
