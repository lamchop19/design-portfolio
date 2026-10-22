/**
 * Cuts the fish and corals out of the public-domain plates in
 * assets/specimens/source/ and prints each one as a 1-bit ordered dither:
 * public/specimens/<id>.png, black dots on transparent, one image pixel per
 * dot. The page uses them as CSS masks, so the ink colour, opacity and the
 * off-register second ink are all set in CSS.
 *
 * How a plate is cut up:
 *   1. The paper colour is the plate's most common colour.
 *   2. Anything far enough from it is "printed"; a coarse, dilated copy of
 *      that mask joins each animal's fins and spines into one blob.
 *   3. Every blob big enough, not touching the scan's edge and not a line of
 *      caption text becomes a specimen.
 *   4. Its coverage (how far each pixel is from paper) is dithered at the
 *      specimen's dot size.
 *
 * Also writes src/lib/specimens.generated.json (every specimen's size, for
 * the layout in src/lib/specimens.ts) and, with --sheet, a contact sheet of
 * every cut to .context/specimens-sheet.png for picking.
 *
 * Run via tsx so it shares src/lib/dither.ts with the browser.
 */
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp, { type OverlayOptions } from 'sharp'

import { ditherToAlpha } from '../src/lib/dither'

const ROOT = path.resolve(import.meta.dirname, '..')
const SOURCE_DIR = path.join(ROOT, 'assets', 'specimens', 'source')
const OUT_DIR = path.join(ROOT, 'public', 'specimens')
const MANIFEST = path.join(ROOT, 'src', 'lib', 'specimens.generated.json')

/** Plates are worked at this height, in px. */
const WORK_HEIGHT = 1600
/** The coarse grid blobs are found on, in work px per cell. */
const CELL = 4
/** Cells of erosion: anything thinner than about twice this is dropped as a line or lettering. */
const ERODE = 2
/** Cells of growth after: enough to win back a fin, not to join two fish. */
const DILATE = 4
/** A specimen's longest side, in dots. */
const MAX_DOTS = 240
/** How far from paper a pixel has to be to count as printed (0–255, per channel). */
const PRINTED = 34

type Cut = { id: string; plate: string; width: number; height: number; x: number; y: number }

async function main() {
  const sheet = process.argv.includes('--sheet')
  await rm(OUT_DIR, { recursive: true, force: true })
  await mkdir(OUT_DIR, { recursive: true })

  const plates = (await readdir(SOURCE_DIR)).filter((f) => f.endsWith('.jpg')).sort()
  const cuts: Cut[] = []
  const previews: Array<{ id: string; png: Buffer; width: number; height: number }> = []
  let bytes = 0

  for (const file of plates) {
    const plate = file.replace(/\.jpg$/, '')
    const { data, info } = await sharp(path.join(SOURCE_DIR, file))
      .resize({ height: WORK_HEIGHT })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    const { width, height } = info

    const paper = paperColour(data)
    const distance = new Uint8Array(width * height)
    for (let i = 0; i < width * height; i++) {
      const o = i * 3
      distance[i] = Math.max(Math.abs(data[o] - paper[0]), Math.abs(data[o + 1] - paper[1]), Math.abs(data[o + 2] - paper[2]))
    }

    if (sheet) {
      const mask = Uint8Array.from(distance, (d) => (d > PRINTED ? 0 : 255))
      await mkdir(path.join(ROOT, '.context', 'specimen-masks'), { recursive: true })
      await sharp(Buffer.from(mask.buffer), { raw: { width, height, channels: 1 } })
        .resize({ height: 500 })
        .png()
        .toFile(path.join(ROOT, '.context', 'specimen-masks', `${plate}.png`))
    }
    const blobs = findBlobs(distance, width, height)
    for (const [n, blob] of blobs.entries()) {
      const id = `${plate}-${String(n + 1).padStart(2, '0')}`
      const cut = await printBlob(id, blob, distance, width)
      cuts.push({ id, plate, width: cut.width, height: cut.height, x: blob.x0 / width, y: blob.y0 / height })
      bytes += cut.size
      if (sheet) previews.push({ id, png: cut.png, width: cut.width, height: cut.height })
    }
  }

  bytes += await printWaves()
  await writeFile(MANIFEST, JSON.stringify(cuts, null, 1) + '\n')
  if (sheet) await contactSheet(previews)
  console.log(`[specimens] ${cuts.length} specimens from ${plates.length} plates, ${(bytes / 1024).toFixed(0)}kB total`)
}

/**
 * The water: one seamless tile of engraved swell lines, like the hatching
 * behind a natural-history plate, dithered so they fray. Every term is
 * periodic in the tile, so it repeats without a seam in both directions.
 */
async function printWaves() {
  const width = 192
  const height = 96
  const gap = 8
  const tau = Math.PI * 2
  const coverage = new Float32Array(width * height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / width
      const v = y / height
      // Each line rises and falls with two swells, and thickens and thins along its length.
      const swell = 2.4 * Math.sin(tau * 2 * u + 1.3) + 1.2 * Math.sin(tau * 3 * u + tau * v)
      const line = Math.sin((tau * (y + swell)) / gap)
      const weight = 0.55 + 0.45 * Math.sin(tau * u + tau * 2 * v)
      coverage[y * width + x] = Math.max(0, (line - (1 - 0.5 * weight)) / (0.5 * weight))
    }
  }
  const rgba = new Uint8ClampedArray(width * height * 4)
  ditherToAlpha(rgba, coverage, width, height)
  const png = await sharp(Buffer.from(rgba.buffer), { raw: { width, height, channels: 4 } })
    .png({ palette: true, colours: 2, compressionLevel: 9 })
    .toBuffer()
  await writeFile(path.join(OUT_DIR, 'water-waves.png'), png)
  return png.length
}

/** The plate's most common colour, quantized: the paper it is printed on. */
function paperColour(rgb: Buffer): [number, number, number] {
  const counts = new Map<number, { n: number; r: number; g: number; b: number }>()
  for (let o = 0; o < rgb.length; o += 3 * 7) {
    const key = ((rgb[o] >> 3) << 10) | ((rgb[o + 1] >> 3) << 5) | (rgb[o + 2] >> 3)
    const bin = counts.get(key) ?? { n: 0, r: 0, g: 0, b: 0 }
    bin.n++
    bin.r += rgb[o]
    bin.g += rgb[o + 1]
    bin.b += rgb[o + 2]
    counts.set(key, bin)
  }
  let best = { n: 0, r: 0, g: 0, b: 0 }
  for (const bin of counts.values()) if (bin.n > best.n) best = bin
  return [best.r / best.n, best.g / best.n, best.b / best.n]
}

type Blob = { label: number; labels: Int32Array; cols: number; x0: number; y0: number; x1: number; y1: number }

/** Connected blobs of printed pixels, on a coarse dilated grid, filtered down to animals. */
function findBlobs(distance: Uint8Array, width: number, height: number): Blob[] {
  const cols = Math.ceil(width / CELL)
  const rows = Math.ceil(height / CELL)

  // A cell is printed when enough of its pixels are.
  const coarse = new Uint8Array(cols * rows)
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      let hits = 0
      for (let y = cy * CELL; y < Math.min(height, (cy + 1) * CELL); y++) {
        for (let x = cx * CELL; x < Math.min(width, (cx + 1) * CELL); x++) if (distance[y * width + x] > PRINTED) hits++
      }
      coarse[cy * cols + cx] = hits >= (CELL * CELL) / 2 ? 1 : 0
    }
  }

  // Open, then grow: eroding first drops thin things (the plate's ruled
  // frame, caption and label lettering, stray marks) that would otherwise
  // bridge animals together; growing afterwards wins back the fins.
  const opened = morph(coarse, cols, rows, ERODE, 'erode')
  const grown = morph(opened, cols, rows, DILATE, 'dilate')

  // Flood-fill labelling.
  const labels = new Int32Array(cols * rows)
  const blobs: Blob[] = []
  const stack: number[] = []
  let next = 0
  for (let start = 0; start < grown.length; start++) {
    if (!grown[start] || labels[start]) continue
    const label = ++next
    labels[start] = label
    stack.push(start)
    let area = 0
    let ink = 0
    let x0 = cols
    let y0 = rows
    let x1 = 0
    let y1 = 0
    while (stack.length) {
      const i = stack.pop()!
      const x = i % cols
      const y = (i / cols) | 0
      area++
      ink += coarse[i]
      if (x < x0) x0 = x
      if (y < y0) y0 = y
      if (x > x1) x1 = x
      if (y > y1) y1 = y
      for (const j of [i - 1, i + 1, i - cols, i + cols]) {
        if (j < 0 || j >= grown.length) continue
        if ((j === i - 1 && x === 0) || (j === i + 1 && x === cols - 1)) continue
        if (grown[j] && !labels[j]) {
          labels[j] = label
          stack.push(j)
        }
      }
    }

    const w = x1 - x0 + 1
    const h = y1 - y0 + 1
    const edge = 3
    const touchesScanEdge = x0 < edge || y0 < edge || x1 >= cols - edge || y1 >= rows - edge
    const big = area > (cols * rows) / 900
    // Caption lines are long and thin; page-sized blobs are the plate's own frame or tint.
    const thin = Math.max(w / h, h / w) > 5
    const whole = w > cols * 0.85 || h > rows * 0.85
    if (big && !touchesScanEdge && !thin && !whole && ink / area > 0.25) {
      blobs.push({ label, labels, cols, x0: x0 * CELL, y0: y0 * CELL, x1: Math.min(width, (x1 + 1) * CELL), y1: Math.min(height, (y1 + 1) * CELL) })
    }
  }
  return blobs.sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0)
}

/** Square-kernel erosion or dilation of a 0/1 grid. */
function morph(grid: Uint8Array, cols: number, rows: number, radius: number, op: 'erode' | 'dilate') {
  const out = new Uint8Array(cols * rows)
  const want = op === 'dilate' ? 1 : 0
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      let hit = false
      for (let dy = -radius; dy <= radius && !hit; dy++) {
        for (let dx = -radius; dx <= radius && !hit; dx++) {
          const x = cx + dx
          const y = cy + dy
          const v = x >= 0 && y >= 0 && x < cols && y < rows ? grid[y * cols + x] : 0
          if (v === want) hit = true
        }
      }
      out[cy * cols + cx] = op === 'dilate' ? (hit ? 1 : 0) : hit ? 0 : 1
    }
  }
  return out
}

/** Dithers one blob at its dot size and writes it out. */
async function printBlob(id: string, blob: Blob, distance: Uint8Array, plateWidth: number) {
  const w = blob.x1 - blob.x0
  const h = blob.y1 - blob.y0
  const coverage = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = blob.x0 + x
      const py = blob.y0 + y
      const inBlob = blob.labels[((py / CELL) | 0) * blob.cols + ((px / CELL) | 0)] === blob.label
      // How far from paper, eased so mid-tones hold some dots and the darkest ink goes solid.
      const d = distance[py * plateWidth + px]
      coverage[y * w + x] = inBlob ? Math.min(1, Math.max(0, (d - 18) / 150)) ** 0.85 : 0
    }
  }

  const scale = Math.min(1, MAX_DOTS / Math.max(w, h))
  const width = Math.max(1, Math.round(w * scale))
  const height = Math.max(1, Math.round(h * scale))
  const small = await sharp(Buffer.from(Float32ToU8(coverage).buffer), { raw: { width: w, height: h, channels: 1 } })
    .resize(width, height, { kernel: 'lanczos3' })
    .extractChannel(0)
    .raw()
    .toBuffer()
  const dots = Float32Array.from(small, (v) => v / 255)

  const rgba = new Uint8ClampedArray(width * height * 4)
  ditherToAlpha(rgba, dots, width, height)
  const png = await sharp(Buffer.from(rgba.buffer), { raw: { width, height, channels: 4 } })
    .png({ palette: true, colours: 2, compressionLevel: 9 })
    .toBuffer()
  await writeFile(path.join(OUT_DIR, `${id}.png`), png)
  return { png, width, height, size: png.length }
}

function Float32ToU8(values: Float32Array) {
  return Uint8Array.from(values, (v) => Math.round(v * 255))
}

/** Every cut on one sheet, labelled with its id, for choosing which to place. */
async function contactSheet(previews: Array<{ id: string; png: Buffer; width: number; height: number }>) {
  const cell = 260
  const cols = 8
  const rows = Math.ceil(previews.length / cols)
  const layers: OverlayOptions[] = []
  for (const [i, p] of previews.entries()) {
    const left = (i % cols) * cell
    const top = Math.floor(i / cols) * (cell + 18)
    const fit = await sharp(p.png).resize(cell - 10, cell - 10, { fit: 'inside', kernel: 'nearest' }).toBuffer()
    layers.push({ input: fit, left: left + 5, top: top + 5 })
    const label = `<svg width="${cell}" height="18"><text x="5" y="13" font-size="12" font-family="Helvetica">${p.id.replace(/-chromo|-plate/, '')}</text></svg>`
    layers.push({ input: Buffer.from(label), left, top: top + cell })
  }
  await mkdir(path.join(ROOT, '.context'), { recursive: true })
  await sharp({ create: { width: cols * cell, height: rows * (cell + 18), channels: 3, background: '#ecebe5' } })
    .composite(layers)
    .png()
    .toFile(path.join(ROOT, '.context', 'specimens-sheet.png'))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
