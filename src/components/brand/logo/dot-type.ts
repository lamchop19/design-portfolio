/*
 * The dotted name's type, so other lines can be set under the mark the way
 * "marc andre lam" is: a 5×7 dot matrix of lowercase letters (an LCD's, like
 * the HD44780's) in the export's own measure. Dots are 1.71-unit squares on a
 * 3.29-unit pitch, letters sit in cells 17.72 units apart, and the name's
 * top row is at y = 115. The letters the name has are read out of the
 * export (readGlyphs), so they match it exactly; the rest are drawn here.
 */

export const PITCH = 3.2857
export const DOT = 1.708
export const ADVANCE = 17.72
export const NAME_TOP = 115
/** Seven rows of dots, top of the first to bottom of the last. */
export const LINE_HEIGHT = 6 * PITCH + DOT

/** Seven rows of five, # for a dot. */
export type Glyph = string[]

/** Letters the name doesn't have, in the same LCD style. Lowercase sits on rows 2–6, with no descenders. */
const DRAWN: Record<string, Glyph> = {
  f: ['..##.', '.#..#', '.#...', '###..', '.#...', '.#...', '.#...'],
  i: ['..#..', '.....', '.##..', '..#..', '..#..', '..#..', '.###.'],
  o: ['.....', '.....', '.###.', '#...#', '#...#', '#...#', '.###.'],
  p: ['.....', '.....', '####.', '#...#', '####.', '#....', '#....'],
  s: ['.....', '.....', '.###.', '#....', '.###.', '....#', '####.'],
  t: ['.#...', '.#...', '###..', '.#...', '.#...', '.#..#', '..##.'],
  u: ['.....', '.....', '#...#', '#...#', '#...#', '#..##', '.##.#'],
}

/**
 * The extremes of one dot as the export draws it ([x0, y0, x1, y1]), or null
 * when the path isn't drawn that way: absolute M, L, H, V and C, closed with Z.
 */
export function dotBox(d: string): [number, number, number, number] | null {
  const tokens = d.match(/[A-Za-z]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g) ?? []
  if (tokens.some((t) => /^[a-z]$/.test(t))) return null
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
      // Anything else, or numbers after a Z: not the shape we expect.
      return null
    }
  }
  if (!xs.length || !ys.length) return null
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]
}

/** The letters of `text` as drawn in the export, one path per letter (spaces have none), each subpath a dot. */
export function readGlyphs(text: string, paths: string[]): Record<string, Glyph> {
  const glyphs: Record<string, Glyph> = {}
  let next = 0
  ;[...text].forEach((letter, cell) => {
    if (letter === ' ') return
    const d = paths[next++]
    if (!d || glyphs[letter]) return
    const rows = Array.from({ length: 7 }, () => [...'.....'])
    for (const dot of d.split(/(?=M)/)) {
      const box = dotBox(dot)
      if (!box) continue
      const col = Math.round((box[0] - cell * ADVANCE) / PITCH)
      const row = Math.round((box[1] - NAME_TOP) / PITCH)
      if (rows[row]?.[col]) rows[row][col] = '#'
    }
    glyphs[letter] = rows.map((r) => r.join(''))
  })
  return { ...DRAWN, ...glyphs }
}

/** How wide `text` sets, from the first dot to the last. */
export const lineWidth = (text: string) => (text.length - 1) * ADVANCE + 4 * PITCH + DOT

/**
 * `text` as square dots, one path per letter, in the name's measure times
 * `scale` with its top left at (x, y). Letters without a glyph leave a gap.
 */
export function dotLine(text: string, glyphs: Record<string, Glyph>, { x, y, scale }: { x: number; y: number; scale: number }) {
  const r = (v: number) => +v.toFixed(3)
  const size = r(DOT * scale)
  return [...text].flatMap((letter, cell) => {
    const glyph = glyphs[letter]
    if (!glyph) return []
    let d = ''
    glyph.forEach((row, j) =>
      [...row].forEach((on, k) => {
        if (on === '#') d += `M${r(x + (cell * ADVANCE + k * PITCH) * scale)} ${r(y + j * PITCH * scale)}h${size}v${size}h-${size}Z`
      }),
    )
    return d ? [d] : []
  })
}
