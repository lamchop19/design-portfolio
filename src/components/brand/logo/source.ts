import { readFileSync } from 'node:fs'
import path from 'node:path'

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
 *
 * Server only: it reads the file system, at build time in the static export.
 */

export type Colorway = 'blue' | 'green' | 'pink'

/** The letters' box in the export's units: the noise filter's region. */
const MONOGRAM = '0 11.8439 245.198 94.0987'
const WHOLE = '0 0 245.198 136.415'

const cache = new Map<string, string>()

export function logoSvg(colorway: Colorway, { ns, monogram = false }: { ns: string; monogram?: boolean }) {
  const key = `${colorway}:${ns}:${monogram}`
  const hit = cache.get(key)
  if (hit) return hit

  let svg = readFileSync(path.join(process.cwd(), 'public/logo', `mal-${colorway}.svg`), 'utf8')

  svg = svg.replace(/<g id="marc andre lam">[\s\S]*?<\/g>/, (group) =>
    monogram ? '' : group.replace(/\bd="([^"]+)"/g, (_, d: string) => `d="${squares(d)}"`),
  )

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
      const tokens = dot.match(/[A-Za-z]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g) ?? []
      if (tokens.some((t) => /^[a-z]$/.test(t))) return dot
      const xs: number[] = []
      const ys: number[] = []
      let cmd = ''
      let i = 0
      const n = () => Number(tokens[i++])
      while (i < tokens.length) {
        if (/^[A-Z]$/.test(tokens[i])) cmd = tokens[i++]
        if (cmd === 'M' || cmd === 'L') {
          xs.push(n())
          ys.push(n())
        } else if (cmd === 'H') {
          xs.push(n())
        } else if (cmd === 'V') {
          ys.push(n())
        } else if (cmd === 'C') {
          for (let k = 0; k < 3; k++) {
            xs.push(n())
            ys.push(n())
          }
        } else if (cmd !== 'Z' || (i < tokens.length && !/^[A-Z]$/.test(tokens[i]))) {
          // Anything else, or numbers after a Z: not the shape we expect, so keep it.
          return dot
        }
      }
      if (!xs.length || !ys.length) return dot
      const r = (v: number) => +v.toFixed(3)
      const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)].map(r)
      return `M${x0} ${y0}H${x1}V${y1}H${x0}Z`
    })
    .join('')
}
