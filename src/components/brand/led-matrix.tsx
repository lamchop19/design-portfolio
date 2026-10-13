'use client'

import { useId } from 'react'

/**
 * A classic 5 × 7 LED matrix, drawn as SVG dots. Unlike a dot-matrix font,
 * every position in the grid is a real lamp: unlit lamps stay faintly
 * visible, which is what makes a departures board legible from a distance.
 */
export const GLYPHS: Record<string, string> = {
  A: '.###.|#...#|#...#|#####|#...#|#...#|#...#',
  B: '####.|#...#|#...#|####.|#...#|#...#|####.',
  C: '.###.|#...#|#....|#....|#....|#...#|.###.',
  D: '####.|#...#|#...#|#...#|#...#|#...#|####.',
  E: '#####|#....|#....|####.|#....|#....|#####',
  F: '#####|#....|#....|####.|#....|#....|#....',
  G: '.###.|#...#|#....|#.###|#...#|#...#|.####',
  H: '#...#|#...#|#...#|#####|#...#|#...#|#...#',
  I: '.###.|..#..|..#..|..#..|..#..|..#..|.###.',
  J: '..###|...#.|...#.|...#.|...#.|#..#.|.##..',
  K: '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#',
  L: '#....|#....|#....|#....|#....|#....|#####',
  M: '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#',
  N: '#...#|#...#|##..#|#.#.#|#..##|#...#|#...#',
  O: '.###.|#...#|#...#|#...#|#...#|#...#|.###.',
  P: '####.|#...#|#...#|####.|#....|#....|#....',
  Q: '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#',
  R: '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
  S: '.####|#....|#....|.###.|....#|....#|####.',
  T: '#####|..#..|..#..|..#..|..#..|..#..|..#..',
  U: '#...#|#...#|#...#|#...#|#...#|#...#|.###.',
  V: '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..',
  W: '#...#|#...#|#...#|#.#.#|#.#.#|#.#.#|.#.#.',
  X: '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
  Y: '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..',
  Z: '#####|....#|...#.|..#..|.#...|#....|#####',
  '0': '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.',
  '1': '..#..|.##..|..#..|..#..|..#..|..#..|.###.',
  '2': '.###.|#...#|....#|...#.|..#..|.#...|#####',
  '3': '#####|...#.|..#..|...#.|....#|#...#|.###.',
  '4': '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.',
  '5': '#####|#....|####.|....#|....#|#...#|.###.',
  '6': '..##.|.#...|#....|####.|#...#|#...#|.###.',
  '7': '#####|....#|...#.|..#..|.#...|.#...|.#...',
  '8': '.###.|#...#|#...#|.###.|#...#|#...#|.###.',
  '9': '.###.|#...#|#...#|.####|....#|...#.|.##..',
  '·': '.....|.....|.....|..#..|.....|.....|.....',
  '-': '.....|.....|.....|.###.|.....|.....|.....',
  ':': '.....|.##..|.##..|.....|.##..|.##..|.....',
  ' ': '.....|.....|.....|.....|.....|.....|.....',
}

export type LedProps = {
  text: string
  /** Lamp shape. */
  shape?: 'round' | 'square'
  /** Lamp size as a share of its cell; bigger lamps read heavier. */
  lamp?: number
  /** Show the unlit lamps. */
  ghost?: boolean
  /** Light up column by column on mount. */
  sweep?: boolean
  /** Re-light a letter when the pointer passes over it. */
  relight?: boolean
  /** A blurred copy of the lit lamps behind them; CSS sets its strength. */
  glow?: 'none' | 'soft' | 'bloom'
  /** Double-strike a letter: every lit lamp also lights its right neighbour. */
  bold?: (index: number) => boolean
  /** Extra attributes for a letter's group, in both the lit and glow layers. */
  glyphProps?: (index: number) => (React.SVGProps<SVGGElement> & { [data: `data-${string}`]: string }) | undefined
  /** Called when the pointer enters a letter. */
  onGlyphEnter?: (index: number, svg: SVGSVGElement) => void
  /** Accessible name; pass null when the text is labelled elsewhere. */
  label?: string | null
  className?: string
}

const ROWS = 7
const COLS = 5

/** Restarts a letter's light-up animation by toggling it off for a frame. */
function relightGlyph(glyph: SVGGElement) {
  glyph.removeAttribute('data-relight')
  requestAnimationFrame(() => glyph.setAttribute('data-relight', ''))
}

/** A stable 0–1 value per lamp, so random effects match between server and client. */
function noise(i: number, x: number, y: number) {
  // Integer hashing only: floating-point trig can differ in the last digits
  // between the server and the browser, which breaks hydration.
  let h = Math.imul(i, 374761393) + Math.imul(x, 668265263) + Math.imul(y, 1274126177)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return ((h >>> 0) % 1000) / 1000
}

function lampBits(ch: string, bold: boolean) {
  const rows = (GLYPHS[ch] ?? GLYPHS[' ']).split('|')
  return rows.map((row) => [...row].map((cell, x) => cell === '#' || (bold && x > 0 && row[x - 1] === '#')))
}

/**
 * Every position in the grid is drawn once as a ghost, and once more as a lamp
 * that is either lit or dark. Lamps stay mounted when the text changes, so CSS
 * can fade them rather than have them vanish.
 */
export function Led({
  text,
  shape = 'round',
  lamp = 0.84,
  ghost = true,
  sweep = true,
  relight = false,
  glow = 'none',
  bold,
  glyphProps,
  onGlyphEnter,
  label,
  className,
}: LedProps) {
  const filterId = `led-glow-${useId().replace(/:/g, '')}`
  const chars = [...text.toUpperCase()]
  const cols = chars.length * 6 - 1
  const r = lamp / 2
  const name = label === undefined ? text : label
  const glyphs = chars.map((ch, i) => lampBits(ch, bold?.(i) ?? false))

  const drawLamp = (key: string, cx: number, cy: number, props: React.SVGProps<SVGElement>) =>
    shape === 'round' ? (
      <circle key={key} cx={cx} cy={cy} r={r} {...(props as React.SVGProps<SVGCircleElement>)} />
    ) : (
      <rect
        key={key}
        x={cx - r}
        y={cy - r}
        width={lamp}
        height={lamp}
        rx={lamp * 0.12}
        {...(props as React.SVGProps<SVGRectElement>)}
      />
    )

  const layer = (role: 'lit' | 'halo') =>
    glyphs.map((bits, i) => {
      const interactive = role === 'lit' && chars[i] !== ' ' && (relight || onGlyphEnter)
      const extra = glyphProps?.(i)
      return (
        <g
          key={i}
          className="led-glyph"
          data-i={i}
          onPointerEnter={
            interactive
              ? (event) => {
                  if (relight) relightGlyph(event.currentTarget)
                  const svg = event.currentTarget.ownerSVGElement
                  if (svg) onGlyphEnter?.(i, svg)
                }
              : undefined
          }
          {...extra}
          style={{ '--i': i, ...extra?.style } as React.CSSProperties}
        >
          {/* An invisible cell so the whole letter catches the pointer, not just its lamps. */}
          {interactive ? <rect x={i * 6 - 0.5} y={-0.5} width={6} height={ROWS} fill="transparent" /> : null}
          {bits.flatMap((row, y) =>
            row.map((on, x) => {
              const cx = i * 6 + x
              return drawLamp(`${x}-${y}`, cx, y, {
                className: on ? 'led-lamp led-on' : 'led-lamp',
                style: { '--c': cx, '--x': x, '--y': y, '--r': noise(i, x, y) } as React.CSSProperties,
              })
            }),
          )}
        </g>
      )
    })

  return (
    <svg
      viewBox={`-0.5 -0.5 ${cols} ${ROWS}`}
      className={['led', className].filter(Boolean).join(' ')}
      data-sweep={sweep || undefined}
      data-glow={glow === 'none' ? undefined : glow}
      style={{ '--cols': cols } as React.CSSProperties}
      {...(name === null ? { 'aria-hidden': true } : { role: 'img', 'aria-label': name })}
    >
      {ghost ? (
        <g className="led-ghosts">
          {chars.flatMap((_, i) =>
            Array.from({ length: ROWS * COLS }, (_, k) => {
              const x = k % COLS
              const y = Math.floor(k / COLS)
              const cx = i * 6 + x
              return drawLamp(`${i}-${k}`, cx, y, {
                className: 'led-off',
                style: { '--c': cx, '--y': y, '--r': noise(i, x, y) } as React.CSSProperties,
              })
            }),
          )}
        </g>
      ) : null}
      {glow !== 'none' ? (
        <>
          <defs>
            <filter id={filterId} x="-10%" y="-60%" width="120%" height="220%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="0.35" result="near" />
              <feGaussianBlur in="SourceGraphic" stdDeviation={glow === 'bloom' ? 1.4 : 0.8} result="far" />
              <feMerge>
                <feMergeNode in="far" />
                <feMergeNode in="near" />
              </feMerge>
            </filter>
          </defs>
          <g className="led-halo" filter={`url(#${filterId})`} aria-hidden="true">
            {layer('halo')}
          </g>
        </>
      ) : null}
      <g className="led-lit">{layer('lit')}</g>
    </svg>
  )
}
