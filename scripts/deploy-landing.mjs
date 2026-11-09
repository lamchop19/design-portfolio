/**
 * Builds the live landing on its own (NEXT_PUBLIC_SITE=landing, see
 * src/lib/site-mode.ts) and keeps only what the homepage needs in
 * .deploy/marcalam-landing, ready for Vercel as a static site:
 *
 *   npm run deploy:landing          build and prune
 *   npx vercel deploy .deploy/marcalam-landing --prod
 *
 * Only the homepage and the 404 page go up, with the built scripts, styles
 * and fonts (_next) and the icons; the other pages and prototypes don't.
 * It first makes the files that are generated but not committed (the
 * image derivatives and their manifest, the share image), so it also works
 * from a fresh clone, as on Vercel. The other generators' output is committed.
 */
import { execSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const out = path.join(root, 'out')
const dest = path.join(root, '.deploy', 'marcalam-landing')

execSync('npm run images && npm run og', { stdio: 'inherit' })

// Webpack, not Turbopack: Turbopack can't currently build the Ocean prototype's Doto font (next/font/google).
execSync('npx next build --webpack', { stdio: 'inherit', env: { ...process.env, NEXT_PUBLIC_SITE: 'landing', NEXT_PUBLIC_BASE_PATH: '' } })

rmSync(dest, { recursive: true, force: true })
mkdirSync(dest, { recursive: true })
const keep = ['index.html', '404.html', '_next', 'favicon.ico', 'icon.svg', 'robots.txt', 'og/index.png']
for (const item of keep) {
  const from = path.join(out, item)
  if (existsSync(from)) cpSync(from, path.join(dest, item), { recursive: true })
}

// Anything else the homepage points at in public/ (an image, a font), copied too.
const html = readFileSync(path.join(out, 'index.html'), 'utf8')
for (const [, ref] of html.matchAll(/(?:src|href|content)="\/((?!_next\/)[^"?#]+\.(?:png|jpe?g|webp|svg|ico|woff2?|json|txt))"/g)) {
  const from = path.join(out, ref)
  const to = path.join(dest, ref)
  if (existsSync(from) && !existsSync(to)) {
    mkdirSync(path.dirname(to), { recursive: true })
    cpSync(from, to)
  }
}

console.log(`\nLanding ready in ${path.relative(root, dest)}. Deploy it with:\n  npx vercel deploy ${path.relative(root, dest)} --prod\n`)
