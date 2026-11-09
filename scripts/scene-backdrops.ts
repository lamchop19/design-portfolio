/**
 * Small copies of the scene stills for the site's backdrop and its scene
 * boxes (src/components/scenes). The backdrop shows a scene blurred and faint,
 * and at that strength a 640px picture looks the same as the 2400px one at a
 * fraction of the weight. Reads public/scenes/<id>-<variant>.webp (not the
 * moving layers) and writes public/scenes/backdrop/<id>-<variant>.webp,
 * skipping any that are already newer than their still.
 *
 *   npm run backdrops
 */
import { mkdir, stat } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

import { SCENES } from '../src/lib/scenes'

const ROOT = path.resolve(import.meta.dirname, '..')
const SCENE_DIR = path.join(ROOT, 'public', 'scenes')
const OUT_DIR = path.join(SCENE_DIR, 'backdrop')
const WIDTH = 640

const modified = (file: string) =>
  stat(file).then(
    (s) => s.mtimeMs,
    () => 0,
  )

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  let written = 0
  for (const scene of SCENES) {
    for (const variant of scene.variants) {
      const name = `${scene.id}-${variant}.webp`
      const from = path.join(SCENE_DIR, name)
      const to = path.join(OUT_DIR, name)
      const painted = await modified(from)
      if (!painted) {
        console.warn(`[backdrops] ${name}: no still yet (npm run scenes)`)
        continue
      }
      if ((await modified(to)) >= painted) continue
      const { size } = await sharp(from).resize(WIDTH).webp({ quality: 70 }).toFile(to)
      console.log(`[backdrops] ${name}: ${(size / 1024).toFixed(0)}kB`)
      written++
    }
  }
  if (!written) console.log('[backdrops] up to date')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
