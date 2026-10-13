'use client'

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
  /** Accessible name; pass null when the text is labelled elsewhere. */
  label?: string | null
  className?: string
}

/** Restarts a letter's light-up animation by toggling it off for a frame. */
function relightGlyph(event: React.PointerEvent<SVGGElement>) {
  const glyph = event.currentTarget
  glyph.removeAttribute('data-relight')
  requestAnimationFrame(() => glyph.setAttribute('data-relight', ''))
}

export function Led({
  text,
  shape = 'round',
  lamp = 0.84,
  ghost = true,
  sweep = true,
  relight = false,
  label,
  className,
}: LedProps) {
  const chars = [...text.toUpperCase()]
  const cols = chars.length * 6 - 1
  const r = lamp / 2
  const name = label === undefined ? text : label

  return (
    <svg
      viewBox={`-0.5 -0.5 ${cols} 7`}
      className={['led', className].filter(Boolean).join(' ')}
      data-sweep={sweep || undefined}
      {...(name === null ? { 'aria-hidden': true } : { role: 'img', 'aria-label': name })}
    >
      {chars.map((ch, i) => {
        const rows = (GLYPHS[ch] ?? GLYPHS[' ']).split('|')
        return (
          <g key={i} className="led-glyph" onPointerEnter={relight && ch !== ' ' ? relightGlyph : undefined}>
            {/* An invisible cell so the whole letter catches the pointer, not just its lamps. */}
            {relight ? <rect x={i * 6 - 0.5} y={-0.5} width={6} height={7} fill="transparent" /> : null}
            {rows.flatMap((row, y) =>
              [...row].map((cell, x) => {
                const on = cell === '#'
                if (!on && !ghost) return null
                const cx = i * 6 + x
                const props = {
                  className: on ? 'led-on' : 'led-off',
                  style: on ? ({ '--c': cx, '--x': x } as React.CSSProperties) : undefined,
                }
                return shape === 'round' ? (
                  <circle key={`${x}-${y}`} cx={cx} cy={y} r={r} {...props} />
                ) : (
                  <rect
                    key={`${x}-${y}`}
                    x={cx - r}
                    y={y - r}
                    width={lamp}
                    height={lamp}
                    rx={lamp * 0.12}
                    {...props}
                  />
                )
              }),
            )}
          </g>
        )
      })}
    </svg>
  )
}
