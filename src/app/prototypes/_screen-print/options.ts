import { disciplinesOf } from '@/lib/disciplines'
import type { WorkMeta } from '@/lib/content'
import { asset } from '@/lib/paths'

import type { Treatment } from './print-gl'

/*
 * The lab's choices: how the press prints (treatment, ink, pitch), what it
 * prints (the stand-in plates or the site's current covers) and where (the
 * homepage's cover cell, a contact sheet, or the cut into a case study).
 */

export type LayoutId = 'home' | 'sheet' | 'cut'

export const LAYOUTS: { id: LayoutId; name: string; note: string }[] = [
  { id: 'home', name: 'Homepage', note: 'The live homepage: the row you point at prints its cover in the cell, then it develops into colour while you stay on the row.' },
  { id: 'sheet', name: 'Contact sheet', note: 'All four covers as proofs on one sheet, with crop marks, a colour bar and each plate’s spec. Point at a proof to develop it.' },
  { id: 'cut', name: 'Cut', note: 'Pick a cover and its ink floods the screen as a growing dot screen; the case study is printed as the dots clear, then develops. Esc or the pill goes back the same way.' },
]

export const TREATMENTS: { id: Treatment; name: string; spec: string; note: string }[] = [
  {
    id: 'halftone',
    name: 'Halftone',
    spec: '45°',
    note: 'Halftone: one ink on a 45° screen, each dot as big as the image is dark there. The colour swells out of the same cells until they merge, the way the maL letters resolve on load.',
  },
  {
    id: 'grain',
    name: 'Grain',
    spec: 'stochastic',
    note: 'Grain: a stochastic stipple, the noise the logo is printed with. The image condenses out of specks; pointed at, the colour comes through speck by speck and the grain keeps boiling, like the logo’s Boil hover.',
  },
  {
    id: 'led',
    name: 'LED',
    spec: '0°, dithered',
    note: 'LED: square lamps on a level grid, lit by an ordered dither, like the dotted name under the monogram. Pointed at, every lamp lights in the picture’s own colour, then it sharpens.',
  },
  {
    id: 'twoink',
    name: 'Two-ink',
    spec: '15° + 75°',
    note: 'Two-ink: two riso plates on their own screens, the second a touch off register, like the site’s two-ink title hover. Pointed at, the plates pull into register as the colour floods in.',
  },
]

export type InkId = 'blue' | 'pink' | 'green' | 'discipline'

/** The logo's three inks, each with the partner its second plate prints in for two-ink. */
const BRAND = {
  blue: { name: 'Blue', hex: '#0059FF', partner: '#FF6C3A' },
  pink: { name: 'Pink', hex: '#F551AB', partner: '#0059FF' },
  green: { name: 'Green', hex: '#81DB89', partner: '#F551AB' },
} as const

export const INKS: { id: InkId; name: string }[] = [
  { id: 'blue', name: 'Blue' },
  { id: 'pink', name: 'Pink' },
  { id: 'green', name: 'Green' },
  { id: 'discipline', name: 'By discipline' },
]

const BY_DISCIPLINE = { Brand: 'blue', Social: 'pink', Content: 'green' } as const

/** The ink a project prints in: the one chosen, or its first discipline's colour. */
export function inkOf(choice: InkId, meta: WorkMeta) {
  const id = choice === 'discipline' ? BY_DISCIPLINE[disciplinesOf(meta)[0]] : choice
  return { ink: BRAND[id].hex, ink2: BRAND[id].partner, name: BRAND[id].name }
}

/** Screen pitch in CSS px. */
export const PITCHES = [5, 7, 10, 14] as const
export type Pitch = (typeof PITCHES)[number]

/** The page's own paper: the prints sit straight on it, under its grain. */
export const PAPER = '#ecebe5'

export type ImageryId = 'plates' | 'covers'

export const IMAGERY: { id: ImageryId; name: string; note: string }[] = [
  {
    id: 'plates',
    name: 'Stand-ins',
    note: 'The images are public-domain Saville-Kent and Renard plates standing in until the projects have real covers.',
  },
  {
    id: 'covers',
    name: 'Site covers',
    note: 'The site’s covers as they are today: tech@nyu’s placeholder art, and numbered brand fills for the rest.',
  },
]

/** A stand-in plate for each project (public/prototypes/screen-print, cropped 4:5 from assets/specimens/source). */
const PLATES: Record<string, { file: string; credit: string }> = {
  'tech-nyu': { file: 'kent-fishes', credit: 'Saville-Kent, Great Barrier Reef Fishes, Chromo XV, 1893' },
  'startup-week': { file: 'renard-angelfish', credit: 'Renard, Poissons, écrevisses et crabes, 1754' },
  'nyu-sydney': { file: 'kent-corals', credit: 'Saville-Kent, Great Barrier Reef Corals, Chromo IX, 1893' },
  shmeel: { file: 'renard-pair', credit: 'Renard, Poissons, écrevisses et crabes, 1754' },
}

export type Source =
  | { kind: 'url'; src: string; credit?: string }
  /** No artwork yet: the site's numbered brand fill, drawn to a canvas so the press can print it. */
  | { kind: 'fill'; fill: string; ink: string; label: string }

const FILLS = [
  { fill: '#0059FF', ink: '#0a0f1f' },
  { fill: '#F551AB', ink: '#0a0f1f' },
  { fill: '#81DB89', ink: '#0a0f1f' },
  { fill: '#10364B', ink: '#f2f8fa' },
]

/**
 * What the press prints for a project. The site's covers go through the image
 * pipeline's 1200px file (the same arithmetic as src/lib/image-loader.ts).
 */
export function sourceOf(imagery: ImageryId, meta: WorkMeta, cover: { src: string } | null, index: number): Source {
  const plate = PLATES[meta.slug]
  if (imagery === 'plates' && plate) return { kind: 'url', src: asset(`/prototypes/screen-print/${plate.file}.webp`), credit: plate.credit }
  if (cover) {
    const dot = cover.src.lastIndexOf('.')
    return { kind: 'url', src: asset(`${cover.src.slice(0, dot)}/1200${cover.src.slice(dot)}`) }
  }
  const { fill, ink } = FILLS[index % FILLS.length]
  return { kind: 'fill', fill, ink, label: String(index + 1).padStart(2, '0') }
}

/** A key that changes when the image does, so a print knows to print in again. */
export function sourceKey(source: Source) {
  return source.kind === 'url' ? source.src : `${source.fill}-${source.label}`
}
