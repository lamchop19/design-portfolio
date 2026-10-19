/**
 * Pulls Marc's Are.na reference board into references/ so agents can look at it
 * while building the site. Nothing here ships — references/ is gitignored and the
 * site never reads it.
 *
 * Writes references/index.md (one entry per block: title, source, Are.na link,
 * local image path) and the images next to it. Re-running replaces the folder,
 * so blocks removed from the board disappear here too.
 *
 * The board is public, so no auth is needed. If it goes private, put a personal
 * access token from are.na/developers in .env.local as ARENA_TOKEN.
 */
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

const CHANNEL = 'portfolio-inspo-vogfuoxzgq4'
const API = 'https://api.are.na/v3'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT_DIR = path.join(ROOT, 'references')

const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' }

/** Uploads keep their filename as the title — "image.png", "1a3d…jpg" — which says nothing. */
const FILENAME = /\.(jpe?g|png|pnj|gif|webp|avif|heic|tiff?|bmp|svg)$/i

const headers = process.env.ARENA_TOKEN ? { Authorization: `Bearer ${process.env.ARENA_TOKEN}` } : {}

async function getBlocks() {
  const blocks = []
  for (let page = 1; ; page++) {
    const res = await fetch(`${API}/channels/${CHANNEL}/contents?per=100&page=${page}`, { headers })
    if (res.status === 401) {
      throw new Error(`Are.na returned 401 — the board is private. Make it public or set ARENA_TOKEN in .env.local.`)
    }
    if (!res.ok) throw new Error(`Are.na returned ${res.status} ${res.statusText}`)
    const body = await res.json()
    blocks.push(...body.data)
    if (!body.meta.has_more_pages) return blocks
  }
}

/** The medium resize (~800px long edge) is plenty to read a reference and cheap to look at. */
async function download(block) {
  const res = await fetch(block.image.medium.src)
  if (!res.ok) return null
  const type = res.headers.get('content-type')?.split(';')[0] ?? ''
  const file = `${block.id}.${EXTENSIONS[type] ?? 'jpg'}`
  await writeFile(path.join(OUT_DIR, file), Buffer.from(await res.arrayBuffer()))
  return file
}

function entry(block, file) {
  const title = block.title && !FILENAME.test(block.title) ? block.title : `Untitled ${block.type.toLowerCase()}`
  const lines = [`## ${title}`, '', `- Are.na: https://www.are.na/block/${block.id}`]
  if (block.source?.url) lines.push(`- Source: ${block.source.url}`)
  if (file) lines.push(`- Image: ${file} (original ${block.image.width}×${block.image.height})`)
  if (block.connection?.connected_at) lines.push(`- Added: ${block.connection.connected_at.slice(0, 10)}`)
  const note = block.type === 'Text' ? block.content?.plain : block.description?.plain
  if (note) lines.push('', note.trim())
  return lines.join('\n')
}

const blocks = (await getBlocks()).filter((b) => ['Image', 'Link', 'Embed', 'Text'].includes(b.type))

await rm(OUT_DIR, { recursive: true, force: true })
await mkdir(OUT_DIR, { recursive: true })

const entries = []
for (const block of blocks) {
  const file = block.image?.medium?.src ? await download(block) : null
  entries.push(entry(block, file))
}

await writeFile(
  path.join(OUT_DIR, 'index.md'),
  [
    '# Design references',
    '',
    `Synced from https://www.are.na/channel/${CHANNEL} on ${new Date().toISOString().slice(0, 10)} by \`npm run refs\`. Don't edit — re-run the script instead.`,
    '',
    ...entries.flatMap((e) => [e, '']),
  ].join('\n'),
)

console.log(`Synced ${blocks.length} references to references/`)
