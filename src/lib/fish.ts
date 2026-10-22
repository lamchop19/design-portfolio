import { hashString, mulberry32 } from './dither'
import type { Role } from './flora'

/*
 * Tropical fish for the airbrushed aquarium (scripts/generate-aquarium.tsx),
 * after the aquarium-lamp and reef-wallpaper references: clownfish,
 * angelfish, blue tang, butterflyfish, moorish idol and neon tetra.
 *
 * Shapes are grouped by the same ink roles as the flora: body, shade (fins
 * and tail), accent (bands, clipped to the body), line (dark edges, eye and
 * markings) and spot (eye white, highlights). Every fish faces right in a
 * 200 × 140 box; the scene flips them.
 */

export const FISH_BOX = { width: 200, height: 140 } as const

export const SPECIES = ['clown', 'angel', 'tang', 'butterfly', 'idol', 'tetra'] as const
export type Species = (typeof SPECIES)[number]

export type FishDrawing = {
  species: Species
  layers: Partial<Record<Role, string[]>>
  colours: Partial<Record<Role, string>>
}

const NAVY = '#23306b'
const WHITE = '#fff8ec'

const CY = 70
const n = (v: number) => Math.round(v * 10) / 10

/** A body outline from the tail joint (x0) to the snout (x1), `h` deep above and below the midline. */
function bodyPath(x0: number, x1: number, h: number, { hump = 1, belly = 1, snout = 0 } = {}) {
  const span = x1 - x0
  return `M${n(x0)} ${CY} C${n(x0 + span * 0.15)} ${n(CY - h * hump)} ${n(x0 + span * 0.7)} ${n(CY - h * 1.05 * hump)} ${n(x1)} ${n(CY - snout)} C${n(x0 + span * 0.7)} ${n(CY + h * 1.05 * belly)} ${n(x0 + span * 0.15)} ${n(CY + h * belly)} ${n(x0)} ${CY} Z`
}

/** Draws one fish. The same seed always draws the same one. */
export function drawFish(species: Species, seed: string): FishDrawing {
  const random = mulberry32(hashString(`${species}-${seed}`))
  const between = (lo: number, hi: number) => lo + random() * (hi - lo)
  const layers: Partial<Record<Role, string[]>> = {}
  const add = (role: Role, svg: string) => (layers[role] ??= []).push(svg)
  const fill = (d: string) => `<path d="${d}"/>`
  const stroke = (d: string, w: number) => `<path d="${d}" fill="none" stroke="#000" stroke-width="${n(w)}" stroke-linecap="round"/>`
  const clip = `b${Math.floor(random() * 1e9)}`
  /** Bands clipped to the body. */
  const bands = (role: Role, d: string, shapes: string) => add(role, `<clipPath id="${clip}${role}"><path d="${d}"/></clipPath><g clip-path="url(#${clip}${role})">${shapes}</g>`)
  const eye = (x: number, y: number, r: number) => {
    add('spot', `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}"/>`)
    add('line', `<circle cx="${n(x + r * 0.2)}" cy="${n(y)}" r="${n(r * 0.55)}"/>`)
  }
  const tail = (x: number, spread: number, fork = 0.4) =>
    fill(`M${n(x + 6)} ${CY} L${n(x - 30)} ${n(CY - spread)} Q${n(x - 30 + 30 * fork)} ${CY} ${n(x - 30)} ${n(CY + spread)} Z`)

  switch (species) {
    case 'clown': {
      const body = bodyPath(46, 182, between(26, 30), { snout: 2 })
      add('shade', tail(48, 24, 0.2))
      add('shade', fill(`M80 ${CY - 26} Q100 ${CY - 48} 118 ${CY - 30} Q130 ${CY - 44} 146 ${CY - 26} Z`))
      add('shade', fill(`M96 ${CY + 26} Q110 ${CY + 44} 128 ${CY + 26} Z`))
      add('body', fill(body))
      let stripes = ''
      for (const x of [70, 118, 160]) stripes += `<path d="M${x - 8} 0 Q${x + 4} ${CY} ${x - 8} 140 L${x + 8} 140 Q${x + 18} ${CY} ${x + 8} 0 Z"/>`
      bands('accent', body, stripes)
      let edges = ''
      for (const x of [70, 118, 160]) for (const dx of [-9, 9]) edges += `<path d="M${x + dx} 0 Q${x + dx + 12} ${CY} ${x + dx} 140" fill="none" stroke="#000" stroke-width="2.4"/>`
      bands('line', body, edges)
      eye(166, CY - 6, 6)
      return { species, layers, colours: { body: '#ff7a3d', shade: '#ff9a5a', accent: WHITE, line: NAVY, spot: WHITE } }
    }
    case 'angel': {
      const h = between(42, 50)
      const body = bodyPath(58, 172, h, { snout: 4 })
      // Tall trailing fins above and below.
      add('shade', fill(`M74 ${n(CY - h + 6)} Q108 ${n(CY - h - 40)} 150 ${n(CY - h + 14)} Z`))
      add('shade', fill(`M74 ${n(CY + h - 6)} Q108 ${n(CY + h + 40)} 150 ${n(CY + h - 14)} Z`))
      add('shade', tail(60, 22, 0.6))
      add('body', fill(body))
      let stripes = ''
      for (const x of [78, 108, 140]) stripes += `<rect x="${x}" y="0" width="${n(between(9, 13))}" height="140"/>`
      bands('accent', body, stripes)
      add('line', stroke(`M74 ${n(CY - h + 6)} Q108 ${n(CY - h - 40)} 150 ${n(CY - h + 14)}`, 1.4))
      eye(160, CY - 8, 5.5)
      return { species, layers, colours: { body: '#ffd84a', shade: '#ffe9a0', accent: '#2a3478', line: NAVY, spot: WHITE } }
    }
    case 'tang': {
      const body = bodyPath(44, 182, between(30, 36), { snout: 6 })
      add('shade', tail(46, 26, 0.7))
      add('shade', fill(`M64 ${CY - 30} Q110 ${CY - 52} 160 ${CY - 30} Z`))
      add('shade', fill(`M70 ${CY + 30} Q110 ${CY + 46} 150 ${CY + 30} Z`))
      add('body', fill(body))
      // The dark "palette" sweep along the flank.
      bands('line', body, `<path d="M60 ${CY + 6} C90 ${CY - 36} 150 ${CY - 30} 166 ${CY - 10} C150 ${CY - 16} 110 ${CY - 18} 92 ${CY + 8} C110 ${CY + 14} 120 ${CY + 24} 104 ${CY + 30} C84 ${CY + 24} 70 ${CY + 16} 60 ${CY + 6} Z"/>`)
      eye(164, CY - 8, 6)
      return { species, layers, colours: { body: '#3f6dff', shade: '#ffd84a', line: NAVY, spot: WHITE } }
    }
    case 'butterfly': {
      const h = between(36, 42)
      const body = bodyPath(54, 178, h, { snout: 0 })
      add('shade', tail(56, 20, 0.2))
      add('shade', fill(`M66 ${n(CY - h + 4)} Q110 ${n(CY - h - 18)} 156 ${n(CY - h + 10)} Z`))
      add('body', fill(body))
      // A snout, and fine diagonal stripes.
      add('body', fill(`M170 ${CY - 6} L192 ${CY - 2} L192 ${CY + 2} L170 ${CY + 6} Z`))
      let stripes = ''
      for (let x = 40; x < 190; x += 12) stripes += `<path d="M${x} 0 L${x + 60} 140" fill="none" stroke="#000" stroke-width="3"/>`
      bands('accent', body, stripes)
      // The eye band that hides the eye.
      bands('line', body, `<rect x="150" y="0" width="12" height="140" transform="rotate(-8 156 ${CY})"/>`)
      add('spot', `<circle cx="86" cy="${CY + 10}" r="7"/>`)
      eye(160, CY - 8, 4)
      return { species, layers, colours: { body: '#ffe14d', shade: '#fff3b0', accent: '#ff8a4c', line: NAVY, spot: WHITE } }
    }
    case 'idol': {
      const h = between(40, 46)
      const body = bodyPath(62, 176, h, { snout: 8, hump: 1.15 })
      add('shade', tail(64, 18, 0.5))
      add('body', fill(body))
      bands('accent', body, `<rect x="76" y="0" width="26" height="140"/><rect x="138" y="0" width="18" height="140"/>`)
      // The long trailing dorsal filament.
      add('line', stroke(`M110 ${n(CY - h + 2)} C100 ${n(CY - h - 40)} 60 ${n(CY - h - 34)} ${n(between(20, 40))} ${n(CY - h - 6)}`, 2.6))
      add('shade', `<path d="M164 ${CY + 4} Q176 ${CY + 10} 186 ${CY + 6} L184 ${CY + 14} Q172 ${CY + 16} 162 ${CY + 12} Z"/>`)
      eye(158, CY - 10, 5)
      return { species, layers, colours: { body: WHITE, shade: '#ffd84a', accent: '#2a3478', line: NAVY, spot: WHITE } }
    }
    case 'tetra': {
      const body = bodyPath(50, 178, between(18, 22), { snout: 2 })
      add('shade', tail(52, 18, 0.5))
      add('body', fill(body))
      bands('accent', body, `<rect x="40" y="${CY + 2}" width="90" height="30"/>`)
      bands('line', body, `<rect x="60" y="${CY - 8}" width="118" height="7"/>`)
      eye(164, CY - 4, 4.5)
      return { species, layers, colours: { body: '#9fd0ff', shade: '#d7ecff', accent: '#ff3d6e', line: '#3f6dff', spot: WHITE } }
    }
  }
}
