'use client'

import { useId } from 'react'

import { GLYPHS } from '@/components/brand/led-matrix'

const ROWS = 7

/** Centres a line on the board's width, so every segment is the same number of tiles. */
export function padTo(text: string, width: number) {
  const line = text.toUpperCase().slice(0, width)
  const left = Math.floor((width - line.length) / 2)
  return line.padStart(line.length + left).padEnd(width)
}

/**
 * A ticker: three equal-width lines laid end to end on one strip, which steps
 * left a whole lamp at a time behind a fixed ghost grid. It travels from the
 * first line to the second, holds, carries on to the third, and stops there.
 * Lamps use the same classes as `Led`, so the board's colour and glow apply.
 */
export function LedTape({
  lines,
  glow,
  delay = 0,
  onDone,
  className,
}: {
  lines: [string, string, string]
  glow: 'none' | 'soft' | 'bloom'
  /** Wait before the strip starts moving, in ms. */
  delay?: number
  onDone: () => void
  className?: string
}) {
  const id = useId().replace(/:/g, '')
  const width = lines[0].length
  const span = width * 6
  const cols = span - 1
  const tape = [...lines.join('')]

  const strip = (role: 'lit' | 'halo') => (
    <g
      className="ll-tape-strip"
      style={{ '--span': span, '--tape-delay': `${delay}ms` } as React.CSSProperties}
      onAnimationEnd={role === 'lit' ? (event) => event.target === event.currentTarget && onDone() : undefined}
    >
      {tape.flatMap((ch, i) =>
        (GLYPHS[ch] ?? GLYPHS[' ']).split('|').flatMap((row, y) =>
          [...row].map((cell, x) =>
            cell === '#' ? (
              <circle
                key={`${i}-${x}-${y}`}
                cx={i * 6 + x}
                cy={y}
                r={0.42}
                className="led-lamp led-on"
                style={{ '--c': i * 6 + x, '--y': y } as React.CSSProperties}
              />
            ) : null,
          ),
        ),
      )}
    </g>
  )

  return (
    <svg
      viewBox={`-0.5 -0.5 ${cols} ${ROWS}`}
      className={['led', className].filter(Boolean).join(' ')}
      data-glow={glow === 'none' ? undefined : glow}
      style={{ '--cols': cols } as React.CSSProperties}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={`clip-${id}`}>
          <rect x={-0.5} y={-0.5} width={cols} height={ROWS} />
        </clipPath>
        <filter id={`glow-${id}`} x="-10%" y="-60%" width="120%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.35" result="near" />
          <feGaussianBlur in="SourceGraphic" stdDeviation={glow === 'bloom' ? 1.4 : 0.8} result="far" />
          <feMerge>
            <feMergeNode in="far" />
            <feMergeNode in="near" />
          </feMerge>
        </filter>
      </defs>
      <g className="led-ghosts">
        {Array.from({ length: span * ROWS }, (_, k) => {
          const c = k % span
          const y = Math.floor(k / span)
          return c % 6 === 5 ? null : <circle key={k} cx={c} cy={y} r={0.42} className="led-off" />
        })}
      </g>
      <g clipPath={`url(#clip-${id})`}>
        {glow !== 'none' ? (
          <g className="led-halo" filter={`url(#glow-${id})`}>
            {strip('halo')}
          </g>
        ) : null}
        <g className="led-lit">{strip('lit')}</g>
      </g>
    </svg>
  )
}
