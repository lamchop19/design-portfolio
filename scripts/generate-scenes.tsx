/**
 * Paints the homepage scenes (src/lib/scenes.ts) into public/scenes: one
 * 2400 × 1350 still per variant, its motion as JSON beside it (the dots that
 * twinkle, the layers that move), and each moving layer as a transparent webp.
 *
 *   npm run scenes                  every scene
 *   npm run scenes -- breaker       just these
 *   npm run scenes -- --preview     also half-size PNGs in .context/scenes to look at
 *
 * Painting takes a while, so it isn't part of dev or build: the outputs are
 * committed, like the bitmaps.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

import { SCENE_SIZE, SCENES } from '../src/lib/scenes'
import { toWebp } from './airbrush'
import { PAINTERS } from './scenes'
import { Canvas } from './scenes/kit'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT_DIR = path.join(ROOT, 'public', 'scenes')
const PREVIEW_DIR = path.join(ROOT, '.context', 'scenes')

async function main() {
  const args = process.argv.slice(2)
  const preview = args.includes('--preview')
  const only = args.filter((a) => !a.startsWith('--'))
  await mkdir(OUT_DIR, { recursive: true })
  if (preview) await mkdir(PREVIEW_DIR, { recursive: true })

  for (const scene of SCENES) {
    if (only.length && !only.includes(scene.id)) continue
    const painter = PAINTERS[scene.id]
    if (!painter) {
      console.warn(`[scenes] ${scene.id}: no painter yet`)
      continue
    }
    for (const variant of scene.variants) {
      const started = Date.now()
      const canvas = new Canvas({ ...SCENE_SIZE }, `${scene.id}-${variant}`)
      const { motion = {}, layers = {}, noise = 16 } = await painter(canvas, variant)
      const name = `${scene.id}-${variant}`
      const still = canvas.finish({ noise, seed: name })
      const webp = await toWebp(still, canvas.size, 80)
      await writeFile(path.join(OUT_DIR, `${name}.webp`), webp)
      for (const [layer, layerCanvas] of Object.entries(layers)) {
        const rgba = layerCanvas.finish({ noise: noise * 0.8, edge: 0.6, seed: `${name}-${layer}` })
        await writeFile(path.join(OUT_DIR, `${name}-${layer}.webp`), await toWebp(rgba, layerCanvas.size, 84))
      }
      await writeFile(path.join(OUT_DIR, `${name}.json`), JSON.stringify(motion))
      if (preview) {
        await sharp(Buffer.from(still.buffer), { raw: { ...canvas.size, channels: 4 } })
          .resize(Math.round(canvas.W / 2))
          .png()
          .toFile(path.join(PREVIEW_DIR, `${name}.png`))
      }
      console.log(`[scenes] ${name}: ${(webp.length / 1024).toFixed(0)}kB, ${((Date.now() - started) / 1000).toFixed(1)}s`)
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
