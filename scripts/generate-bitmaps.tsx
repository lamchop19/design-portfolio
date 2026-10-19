/**
 * Prints every project's bitmap specimen, in every palette and pixel size, to
 * public/bitmap/ as small PNGs (one bitmap pixel per image pixel; the page
 * scales them up with `image-rendering: pixelated`). The "Pre-rendered" mode
 * of /prototypes/bitmap shows these instead of drawing on a canvas.
 *
 * Run via tsx so it can import the TypeScript content and the dither itself,
 * which is the same module the live canvas uses.
 */
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

import { buildField, inksFor, PALETTES, PIXEL_SIZES, print, printPath, PRINT_SIZE } from '../src/app/prototypes/_bitmap/dither'
import { routesOf } from '../src/lib/routes'
import { work } from '../content/work'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT_DIR = path.join(ROOT, 'public', 'bitmap')

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true })
  await mkdir(OUT_DIR, { recursive: true })

  let files = 0
  let bytes = 0
  for (const meta of work) {
    for (const pixel of PIXEL_SIZES) {
      const width = Math.round(PRINT_SIZE.width / pixel)
      const height = Math.round(PRINT_SIZE.height / pixel)
      const field = buildField(meta.slug, width, height)
      for (const palette of PALETTES) {
        const rgba = new Uint8ClampedArray(width * height * 4)
        print(rgba, field, width, height, inksFor(palette.id, routesOf(meta)))
        const file = path.join(ROOT, 'public', printPath(meta.slug, palette.id, pixel))
        const info = await sharp(Buffer.from(rgba.buffer), { raw: { width, height, channels: 4 } })
          .png({ palette: true, colours: 16, compressionLevel: 9 })
          .toFile(file)
        files++
        bytes += info.size
      }
    }
  }
  console.log(`[bitmaps] ${files} specimens, ${(bytes / 1024).toFixed(0)}kB total`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
