import { readFileSync } from 'node:fs'
import path from 'node:path'

import { dotBox, dotLine, LINE_HEIGHT, lineWidth, NAME_TOP, readGlyphs } from './dot-type'

/*
 * The maL mark as markup, for server components to place inline (the
 * animations in ./effects reach into its letters, gradients and noise). Read
 * from the Figma exports in public/logo and tidied on the way out:
 *
 * - The dotted name's dots are drawn in the export as rounded squares with
 *   Figma's no-op curves on every corner, about 65KB of the 70KB file. Each dot
 *   is redrawn as a plain square from its extremes: the same look at a tenth
 *   of the size.
 * - The ids that url() points at are namespaced, so two marks can share a page.
 * - The fixed size and preserveAspectRatio="none" go, so CSS sizes the mark.
 * - `monogram` drops the name and crops to the letters, for small sizes.
 * - `card` sets a second dotted line in the name's place, in its type and
 *   colour (./dot-type), for the intro's title card: fitted to the mark's
 *   width, or at the name's own size and overhanging (`cardFit: 'dots'`).
 *
 * Server only: it reads the file system, at build time in the static export.
 */

export type Colorway = 'blue' | 'green' | 'pink'

/** The letters' box in the export's units: the noise filter's region. */
const MONOGRAM = '0 11.8439 245.198 94.0987'
const WHOLE = '0 0 245.198 136.415'
const WIDTH = 245.198
const NAME = /<g id="marc andre lam">[\s\S]*?<\/g>/

const cache = new Map<string, string>()

export function logoSvg(
  colorway: Colorway,
  { ns, monogram = false, card, cardFit = 'width' }: { ns: string; monogram?: boolean; card?: string; cardFit?: 'width' | 'dots' },
) {
  const key = `${colorway}:${ns}:${monogram}:${card}:${cardFit}`
  const hit = cache.get(key)
  if (hit) return hit

  let svg = readFileSync(path.join(process.cwd(), 'public/logo', `mal-${colorway}.svg`), 'utf8')

  svg = svg.replace(NAME, (group) => {
    if (monogram) return ''
    const name = group.replace(/\bd="([^"]+)"/g, (_, d: string) => `d="${squares(d)}"`)
    return card ? name + titleCard(group, card, cardFit) : name
  })

  // Namespace what url() refers to: the noise filter and the three gradients.
  for (const [, id] of svg.matchAll(/<(?:filter|linearGradient)\b[^>]*\bid="([^"]+)"/g)) {
    svg = svg.replaceAll(`id="${id}"`, `id="${ns}-${id}"`).replaceAll(`url(#${id})`, `url(#${ns}-${id})`)
  }

  svg = svg.replace(
    /<svg\b[^>]*>/,
    `<svg viewBox="${monogram ? MONOGRAM : WHOLE}" fill="none" overflow="visible" xmlns="http://www.w3.org/2000/svg" data-ns="${ns}" aria-hidden="true" focusable="false">`,
  )

  cache.set(key, svg)
  return svg
}

/** A path of dots, each redrawn as the square that bounds it. Paths with relative commands are left alone. */
function squares(d: string) {
  return d
    .split(/(?=M)/)
    .map((dot) => {
      const box = dotBox(dot)
      if (!box) return dot
      const [x0, y0, x1, y1] = box.map((v) => +v.toFixed(3))
      return `M${x0} ${y0}H${x1}V${y1}H${x0}Z`
    })
    .join('')
}

/** `text` in the name's dots and colour, centred where the name sits, one path per letter. */
function titleCard(name: string, text: string, fit: 'width' | 'dots') {
  const paths = [...name.matchAll(/\bd="([^"]+)"/g)].map((m) => m[1])
  const fill = name.match(/\bfill="([^"]+)"/)?.[1] ?? 'currentColor'
  const width = lineWidth(text)
  const scale = fit === 'width' ? Math.min(1, WIDTH / width) : 1
  const letters = dotLine(text, readGlyphs('marc andre lam', paths), {
    x: (WIDTH - width * scale) / 2,
    y: NAME_TOP + (LINE_HEIGHT * (1 - scale)) / 2,
    scale,
  })
  return `<g id="title card" fill="${fill}">${letters.map((d) => `<path d="${d}"/>`).join('')}</g>`
}
