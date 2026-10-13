/**
 * Dot-matrix candidates for the wordmark. Font faces run through the real
 * split-flap wordmark; LED variants are drawn lamp by lamp (led.tsx).
 */
export type FontFace = {
  kind: 'font'
  id: string
  label: string
  family: string
  weight: number
  /** font-variation-settings for the face's custom axes. */
  axes: string
  note: string
}

export type LedFace = {
  kind: 'led'
  id: string
  label: string
  shape: 'round' | 'square'
  lamp: number
  board: boolean
  note: string
}

export type DotFace = FontFace | LedFace

export const DOT_FACES: DotFace[] = [
  {
    kind: 'font',
    id: 'doto-now',
    label: 'Doto, as in the lab',
    family: 'var(--lab-doto)',
    weight: 500,
    axes: "'ROND' 100",
    note: 'What the lab showed: the site’s wordmark weight (500) won over the heavier setting, so the dots shrank.',
  },
  {
    kind: 'font',
    id: 'doto-heavy',
    label: 'Doto, heavy round',
    family: 'var(--lab-doto)',
    weight: 900,
    axes: "'ROND' 100",
    note: 'Same face at its heaviest. The dots grow until they nearly touch, so strokes read as lines.',
  },
  {
    kind: 'font',
    id: 'doto-square',
    label: 'Doto, heavy square',
    family: 'var(--lab-doto)',
    weight: 900,
    axes: "'ROND' 0",
    note: 'Square lamps fill more of each cell than circles, so the letters look denser at the same weight.',
  },
  {
    kind: 'font',
    id: 'bitcount-double-round',
    label: 'Bitcount Grid Double, round',
    family: 'var(--lab-bitcount-double)',
    weight: 380,
    axes: "'ELSH' 0, 'ELXP' 0",
    note: 'Two-lamp-wide strokes on a finer grid, with round dots set just short of touching. Much sturdier letters than a single-stroke matrix.',
  },
  {
    kind: 'font',
    id: 'bitcount-double-square',
    label: 'Bitcount Grid Double, square',
    family: 'var(--lab-bitcount-double)',
    weight: 380,
    axes: "'ELSH' 55, 'ELXP' 0",
    note: 'The same grid with square pixels, closer to an LED panel than a dot-matrix printer.',
  },
  {
    kind: 'font',
    id: 'bitcount-single-round',
    label: 'Bitcount Grid Single, round',
    family: 'var(--lab-bitcount-single)',
    weight: 460,
    axes: "'ELSH' 0, 'ELXP' 0",
    note: 'Single-lamp strokes like Doto, but on a tighter grid with larger dots.',
  },
  {
    kind: 'font',
    id: 'handjet',
    label: 'Handjet',
    family: 'var(--lab-handjet)',
    weight: 700,
    axes: "'ELSH' 8, 'ELGR' 1",
    note: 'Round lamps that fuse into solid strokes, on a tall, narrow grid like a bus destination blind.',
  },
  {
    kind: 'font',
    id: 'dotgothic',
    label: 'DotGothic16',
    family: 'var(--lab-dotgothic)',
    weight: 400,
    axes: 'normal',
    note: 'A bitmap face from Japanese LCDs: square dots, compact and very legible, one weight only.',
  },
  {
    kind: 'led',
    id: 'led-round',
    label: 'LED 5 × 7, round lamps',
    shape: 'round',
    lamp: 0.86,
    board: false,
    note: 'Custom drawn. Every lamp position is visible and the lit ones are filled, like a real departures board.',
  },
  {
    kind: 'led',
    id: 'led-board',
    label: 'LED 5 × 7, on a board',
    shape: 'round',
    lamp: 0.86,
    board: true,
    note: 'The same lamps lit up on a dark board, so they stand out from the page in both themes.',
  },
  {
    kind: 'led',
    id: 'led-square',
    label: 'LED 5 × 7, square lamps',
    shape: 'square',
    lamp: 0.82,
    board: false,
    note: 'Square lamps, the heaviest and most graphic of the set.',
  },
]
