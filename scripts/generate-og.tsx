/**
 * Renders Open Graph cards to real .png files in public/og/.
 *
 * Next's `opengraph-image` file convention emits extensionless files, which a
 * static host serves as application/octet-stream — enough for some scrapers to
 * reject the image. Writing plain .png files sidesteps that, at the cost of
 * wiring the metadata by hand (see ogImage() in src/lib/og.ts).
 *
 * Run via tsx so it can import the TypeScript content sources directly.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'

import { site } from '../content/site'
import { work } from '../content/work'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT_DIR = path.join(ROOT, 'public', 'og')

const SIZE = { width: 1200, height: 630 }
const PALETTE = {
  bg: '#ffffff',
  ink: '#0a0f1f',
  muted: '#4a5169',
  rule: '#e3e7ef',
  blue: '#0059ff',
  pink: '#f551ab',
  green: '#81db89',
}

/** The brand grid, as the card's footer band. Two rows of the 8-cell unit. */
const GRID_ROWS = [
  ['blue', null, 'pink', null, null, 'green', 'blue', null],
  [null, 'blue', null, 'pink', 'green', null, null, 'blue'],
] as const

const CELL = 60
const BAND_H = 38

function GridBand() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {GRID_ROWS.map((row, r) => (
        <div key={r} style={{ display: 'flex' }}>
          {Array.from({ length: Math.ceil(SIZE.width / CELL) }, (_, i) => {
            const key = row[i % row.length]
            return (
              <div
                key={i}
                style={{
                  width: CELL,
                  height: BAND_H,
                  background: key ? PALETTE[key] : PALETTE.bg,
                }}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}

function Card({ eyebrow, title, footer }: { eyebrow: string; title: string; footer: string }) {
  return (
    <div
      style={{
        width: SIZE.width,
        height: SIZE.height,
        display: 'flex',
        flexDirection: 'column',
        background: PALETTE.bg,
        color: PALETTE.ink,
        fontFamily: 'Bricolage',
      }}
    >
      {/* Explicit height rather than space-between across the whole card: satori
          otherwise compresses or clips the fixed-height band at the bottom. */}
      <div
        style={{
          height: SIZE.height - BAND_H * 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '68px 80px 30px',
        }}
      >
        <div style={{ display: 'flex', fontSize: 26, letterSpacing: 2, color: PALETTE.muted }}>
          {eyebrow.toUpperCase()}
        </div>
        <div
          style={{
            display: 'flex',
            // Long headlines step down a size or they overflow the card.
            fontSize: title.length > 40 ? 72 : 96,
            lineHeight: 1.04,
            letterSpacing: -3,
            maxWidth: 940,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontSize: 26,
            color: PALETTE.muted,
          }}
        >
          <span>{footer}</span>
          <span style={{ color: PALETTE.blue }}>{site.domain}</span>
        </div>
      </div>
      <GridBand />
    </div>
  )
}

async function main() {
  // Satori needs raw ttf/otf — next/font's woff2 output can't be reused here, and
  // a multi-axis variable font makes it throw, hence the vendored static instance.
  const font = await readFile(path.join(ROOT, 'assets/og/BricolageGrotesque.ttf'))

  async function render(name: string, props: React.ComponentProps<typeof Card>) {
    const response = new ImageResponse(<Card {...props} />, {
      ...SIZE,
      fonts: [{ name: 'Bricolage', data: font, style: 'normal' as const, weight: 400 as const }],
    })
    const buf = Buffer.from(await response.arrayBuffer())
    await writeFile(path.join(OUT_DIR, `${name}.png`), buf)
    return buf.length
  }

  await mkdir(OUT_DIR, { recursive: true })

  let total = await render('index', {
    eyebrow: site.name,
    title: site.headline,
    footer: 'Selected work',
  })

  for (const meta of work) {
    total += await render(`work-${meta.slug}`, {
      eyebrow: `${meta.title} · ${meta.subtitle}`,
      title: meta.headline,
      footer: meta.timeline,
    })
  }

  console.log(`[og] ${work.length + 1} cards, ${(total / 1024).toFixed(0)}kB total`)
}

main()
