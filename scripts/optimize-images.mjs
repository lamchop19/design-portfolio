/**
 * Static export has no image optimization server, so we do it here at build time.
 *
 * Every source image under content/ is rendered to one file per configured width
 * (see IMAGE_WIDTHS, which must stay in sync with images.deviceSizes/imageSizes in
 * next.config.ts). Because a file exists for *every* width, src/lib/image-loader.ts
 * can build a URL arithmetically without consulting a manifest at runtime.
 *
 * The manifest it writes is for the server only: intrinsic dimensions and a tiny
 * blur placeholder, both of which next/image needs at render time.
 */
import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = path.resolve(import.meta.dirname, '..')
const CONTENT_DIR = path.join(ROOT, 'content')
const OUT_DIR = path.join(ROOT, 'public', 'img')
const MANIFEST = path.join(ROOT, 'src', 'lib', 'image-manifest.json')
const CACHE = path.join(ROOT, 'node_modules', '.cache', 'portfolio-images.json')

const IMAGE_WIDTHS = [256, 384, 640, 828, 1200, 1920, 2560]
const FORMAT = 'avif'
const QUALITY = 62
const SOURCE_RE = /\.(jpe?g|png|tiff?|webp)$/i

async function walk(dir) {
  const out = []
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(full)))
    else if (SOURCE_RE.test(entry.name)) out.push(full)
  }
  return out
}

async function readCache() {
  try {
    return JSON.parse(await readFile(CACHE, 'utf8'))
  } catch {
    return {}
  }
}

/** Key an image by its path relative to content/, e.g. "work/tech-nyu/cover.jpg". */
function keyFor(file) {
  return path.relative(CONTENT_DIR, file).split(path.sep).join('/')
}

async function main() {
  const files = (await walk(CONTENT_DIR)).sort()
  if (files.length === 0) {
    console.log('[images] no source images under content/ yet — writing empty manifest')
  }

  const cache = await readCache()
  const nextCache = {}
  const manifest = {}
  let built = 0
  let skipped = 0

  for (const file of files) {
    const key = keyFor(file)
    const buf = await readFile(file)
    const hash = createHash('sha1')
      .update(buf)
      .update(`${FORMAT}${QUALITY}${IMAGE_WIDTHS.join(',')}`)
      .digest('hex')
      .slice(0, 12)

    const meta = await sharp(buf).metadata()
    // Strip the extension: "work/x/cover.jpg" -> derivatives live in "img/work/x/cover/"
    const stem = key.replace(/\.[^.]+$/, '')
    const destDir = path.join(OUT_DIR, stem)

    const cached = cache[key]
    if (cached?.hash === hash && (await exists(path.join(destDir, `${IMAGE_WIDTHS.at(-1)}.${FORMAT}`)))) {
      manifest[key] = cached.entry
      nextCache[key] = cached
      skipped++
      continue
    }

    await mkdir(destDir, { recursive: true })

    for (const width of IMAGE_WIDTHS) {
      // Never upscale: clamp to the source width but still emit the file, so the
      // loader can request any configured width without 404ing.
      const target = Math.min(width, meta.width)
      await sharp(buf)
        .resize({ width: target, withoutEnlargement: true })
        .toFormat(FORMAT, { quality: QUALITY })
        .toFile(path.join(destDir, `${width}.${FORMAT}`))
    }

    // 16px-wide blur placeholder, inlined as a data URL in the HTML.
    const lqipBuf = await sharp(buf).resize({ width: 16 }).webp({ quality: 40 }).toBuffer()

    const entry = {
      src: `/img/${stem}.${FORMAT}`,
      width: meta.width,
      height: meta.height,
      blurDataURL: `data:image/webp;base64,${lqipBuf.toString('base64')}`,
    }
    manifest[key] = entry
    nextCache[key] = { hash, entry }
    built++
  }

  await mkdir(path.dirname(MANIFEST), { recursive: true })
  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`)
  await mkdir(path.dirname(CACHE), { recursive: true })
  await writeFile(CACHE, JSON.stringify(nextCache))

  console.log(`[images] ${built} built, ${skipped} cached, ${files.length} total`)
}

async function exists(p) {
  try {
    await stat(p)
    return true
  } catch {
    return false
  }
}

await main()
