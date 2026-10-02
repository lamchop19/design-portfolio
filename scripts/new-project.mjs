/**
 * Scaffolds a case study: `npm run new-project -- "Project Name"`
 *
 * Creates content/work/<slug>/{meta.ts,body.mdx,assets/} and registers the new
 * meta in content/work/index.ts, so adding work stays a one-command job.
 */
import { mkdir, readFile, writeFile, access } from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const WORK_DIR = path.join(ROOT, 'content', 'work')
const REGISTRY = path.join(WORK_DIR, 'index.ts')

const title = process.argv.slice(2).join(' ').trim()
if (!title) {
  console.error('Usage: npm run new-project -- "Project Name"')
  process.exit(1)
}

const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

/** tech@nyu -> techNyu, so the registry import reads naturally. */
const camel = slug.replace(/-(.)/g, (_, c) => c.toUpperCase())

const dir = path.join(WORK_DIR, slug)
if (await exists(dir)) {
  console.error(`content/work/${slug} already exists.`)
  process.exit(1)
}

await mkdir(path.join(dir, 'assets'), { recursive: true })

await writeFile(
  path.join(dir, 'meta.ts'),
  `import { defineWork } from '@/lib/content'

export const meta = defineWork({
  slug: '${slug}',
  title: '${title.replace(/'/g, "\\'")}',
  subtitle: 'discipline',
  headline: 'The claim this case study argues',
  role: 'Your role',
  timeline: 'Month – Month ${new Date().getFullYear()}',
  team: 'Solo',
  client: 'Client',
  year: ${new Date().getFullYear()},
  tags: [],
})
`,
)

await writeFile(
  path.join(dir, 'body.mdx'),
  `Opening context — what this is and why it existed.

## My approach

What the problem actually was, and what you did about it.

{/* <Figure src="work/${slug}/assets/example.jpg" alt="" caption="" wide /> */}

## Takeaways

What you'd carry into the next one.
`,
)

// Register in the barrel file: add the import alphabetically, then the array entry.
let registry = await readFile(REGISTRY, 'utf8')
const importLine = `import { meta as ${camel} } from './${slug}/meta'`

const imports = registry.match(/^import \{ meta as .+$/gm) ?? []
const insertAfter = imports.filter((line) => line < importLine).pop() ?? imports[0]
registry = insertAfter
  ? registry.replace(insertAfter, `${insertAfter}\n${importLine}`)
  : registry.replace(/\n\n/, `\n\n${importLine}\n`)

registry = registry.replace(
  /const all: WorkMeta\[\] = \[([^\]]*)\]/,
  (_, inner) => `const all: WorkMeta[] = [${inner.trim()}, ${camel}]`,
)

await writeFile(REGISTRY, registry)

console.log(`Created content/work/${slug}/ and registered it in content/work/index.ts`)
console.log('Next: fill in meta.ts, write body.mdx, drop images in assets/, run `npm run images`.')

async function exists(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}
