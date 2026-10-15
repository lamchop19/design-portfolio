'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Led } from '@/components/brand/led-matrix'

import { barcode, nameMask, type FxContext } from './fx'
import { LedFx, type FxHandle } from './fx-layer'
import { randomGlyph, useReducedMotion, useStrays } from './hooks'

import './led-wordmark.css'

const ROWS = 7
/** The board field reaches this many lamps past the name on each side. */
const FIELD = { x: 12, y: 6 }
/** Effects here stay on the board itself. */
const NO_MARGIN = { x: 0, y: 0 }
const TRAIL = ['var(--brand-pink)', 'var(--brand-green)']
/** How long the resolve load runs before the sequence may start, in ms. */
const LOAD_MS = 1500
/** The pause between beats of the idle sequence, in ms. */
const GAP = [2600, 6800] as const
/** The barcode scan comes round on its own at most this often, in ms. */
const BARCODE_EVERY = 30_000

type Beat = 'refresh' | 'run' | 'bulb' | 'barcode'
/** Beats of the idle sequence and how often each is picked, relative to the others. */
const BEATS: [Beat, number][] = [
  ['refresh', 5],
  ['run', 2],
  ['bulb', 3],
  ['barcode', 1],
]

const now = () => Date.now()

function pickBeat(): Beat {
  const total = BEATS.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = Math.random() * total
  for (const [beat, weight] of BEATS) {
    roll -= weight
    if (roll < 0) return beat
  }
  return 'refresh'
}

/**
 * The homepage's LED wordmark: the name in blue lamps on the bare page, with
 * a pool of light beneath while it's pointed at. It resolves lamp by lamp on load.
 * Letters take a brand colour and flick through a few glyphs under the pointer,
 * and a click reads the name as a barcode.
 *
 * Left alone it runs a loose sequence at random intervals, one beat at a time
 * so nothing overlaps: a letter refreshes, a short run of letters refreshes, a
 * bulb fails, or, now and then, the barcode scan plays by itself. The beats
 * pause while the board is hidden or the tab is in the background.
 *
 * Decorative: the heading that holds it carries the name as text.
 */
export function LedWordmark({
  text,
  field = false,
  spill = false,
  loadDelay = 0,
  className,
}: {
  text: string
  /** Wait before resolving on load, in ms, so a page can choreograph it. */
  loadDelay?: number
  /** Stray lamps blinking in the space around the name. */
  field?: boolean
  /** A pool of lamp light on the surface under the board, on hover. */
  spill?: boolean
  className?: string
}) {
  const motion = !useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const fxRef = useRef<FxHandle>(null)
  const name = text.toUpperCase()
  const cols = name.length * 6 - 1
  const letters = useMemo(() => [...name].flatMap((ch, i) => (ch === ' ' ? [] : [i])), [name])

  const [settled, setSettled] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(true), LOAD_MS + loadDelay)
    return () => clearTimeout(timer)
  }, [loadDelay])

  const [flicks, setFlicks] = useState<Record<number, string>>({})
  const shown = [...name].map((ch, i) => flicks[i] ?? ch).join('')

  const hovering = useRef(false)
  const lastBarcode = useRef(0)
  const trailIndex = useRef(0)

  const strays = useStrays(
    motion && field && settled,
    { cols: cols + FIELD.x * 2, rows: ROWS + FIELD.y * 2 },
    { x: FIELD.x, y: FIELD.y, w: cols, h: ROWS },
  )

  // The barcode effect reads the name's lamps from here, fresh every tick.
  const mask = useMemo(() => nameMask(shown), [shown])
  const context = useRef<FxContext | null>(null)
  useEffect(() => {
    context.current = {
      cols,
      rows: ROWS,
      field: NO_MARGIN,
      lit: mask.set,
      litCells: mask.cells,
      colourAt: () => 'var(--lamp-on)',
    }
  })
  const getContext = useCallback(() => context.current, [])

  /** A letter ticks through a few random glyphs and back. */
  const flick = useCallback((i: number) => {
    for (let step = 0; step < 4; step++) {
      window.setTimeout(() => setFlicks((f) => ({ ...f, [i]: randomGlyph() })), step * 55)
    }
    window.setTimeout(
      () =>
        setFlicks((f) => {
          const next = { ...f }
          delete next[i]
          return next
        }),
      4 * 55,
    )
  }, [])

  /** A letter buzzes like a tired bulb. */
  const buzz = useCallback((i: number) => {
    const groups = rootRef.current?.querySelectorAll(`.led-glyph[data-i="${i}"]`) ?? []
    groups.forEach((g) => g.setAttribute('data-buzz', ''))
    window.setTimeout(() => groups.forEach((g) => g.removeAttribute('data-buzz')), 900)
  }, [])

  const scan = useCallback(() => {
    const fx = fxRef.current
    if (!fx || fx.busy('scan')) return
    lastBarcode.current = now()
    fx.play('scan', barcode(name))
  }, [name])

  // The idle sequence.
  useEffect(() => {
    if (!motion || !settled) return
    const random = () => letters[Math.floor(Math.random() * letters.length)]
    const play = (beat: Beat) => {
      if (beat === 'barcode' && (hovering.current || now() - lastBarcode.current < BARCODE_EVERY)) beat = 'refresh'
      if (beat === 'refresh') flick(random())
      if (beat === 'bulb') buzz(random())
      if (beat === 'barcode') scan()
      if (beat === 'run') {
        // Three neighbouring letters, left to right.
        const start = Math.floor(Math.random() * Math.max(1, letters.length - 2))
        letters.slice(start, start + 3).forEach((i, k) => window.setTimeout(() => flick(i), k * 110))
      }
    }
    let timer = 0
    const next = () => {
      timer = window.setTimeout(
        () => {
          const visible = (rootRef.current?.getClientRects().length ?? 0) > 0
          if (visible && !document.hidden && !fxRef.current?.busy('scan')) play(pickBeat())
          next()
        },
        GAP[0] + Math.random() * (GAP[1] - GAP[0]),
      )
    }
    next()
    return () => clearTimeout(timer)
  }, [motion, settled, letters, flick, buzz, scan])

  const onGlyphEnter = useCallback(
    (i: number, svg: SVGSVGElement) => {
      const colour = TRAIL[trailIndex.current++ % TRAIL.length]
      svg.querySelectorAll<SVGGElement>(`.led-glyph[data-i="${i}"]`).forEach((g) => {
        g.style.setProperty('--tint', colour)
        g.setAttribute('data-tint', '')
        requestAnimationFrame(() => requestAnimationFrame(() => g.removeAttribute('data-tint')))
      })
      flick(i)
    },
    [flick],
  )

  return (
    <div
      ref={rootRef}
      className={['ledw', className].filter(Boolean).join(' ')}
      data-load={settled ? undefined : ''}
      data-interactive={motion || undefined}
      style={{ '--cols': cols, '--ledw-delay': `${loadDelay}ms` } as React.CSSProperties}
      onClick={motion ? scan : undefined}
      onPointerEnter={() => {
        hovering.current = true
      }}
      onPointerLeave={() => {
        hovering.current = false
      }}
    >
      {spill ? <div className="ledw-spill" aria-hidden="true" /> : null}
      {field ? (
        <div className="ledw-field" aria-hidden="true">
          {strays.map((s) => (
            <span
              key={s.id}
              className="ledw-stray"
              style={{ '--x': s.x, '--y': s.y, '--stray': s.colour } as React.CSSProperties}
            />
          ))}
        </div>
      ) : null}
      <Led
        text={shown}
        label={null}
        ghost={false}
        sweep={false}
        onGlyphEnter={motion ? onGlyphEnter : undefined}
        className="ledw-main"
      />
      <LedFx
        ref={fxRef}
        getContext={getContext}
        boardRef={rootRef}
        cols={cols}
        rows={ROWS}
        field={NO_MARGIN}
        glow={false}
        className="ledw-fx"
      />
    </div>
  )
}
