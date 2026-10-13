'use client'

import { useEffect, useId, useImperativeHandle, useRef, useState } from 'react'

import { cellKey, type Cell, type Fx, type FxContext } from './fx'

export type FxHandle = {
  /** Starts an effect on a named track, replacing whatever ran there. */
  play: (track: string, fx: Fx) => void
  stop: (track: string) => void
  busy: (track: string) => boolean
}

type Drawn = Cell & { key: string }

const TICK_MS = 30
const MAX_FRAMES = 400
const R = 0.42

/** Colours arrive as CSS (custom properties, color-mix), which only style resolves, not SVG attributes. */
const paint = (cell: Cell) => ({ fill: cell.colour, fillOpacity: cell.a ?? 1 })

/**
 * A second lamp grid over the board, reaching `field` lamps past it on every
 * side so effects can arrive from off the board. Effects run on named tracks
 * and redraw every tick; tracks whose names start with `idle:` paint first,
 * so a click effect always sits on top. While any frame asks for it, the
 * board gets `data-fx-hide` so the overlay can move the name's own lamps.
 * The overlay keeps its own state, so the board itself doesn't re-render.
 */
export function LedFx({
  ref,
  getContext,
  boardRef,
  cols,
  rows,
  field,
  glow,
  className,
}: {
  ref: React.Ref<FxHandle>
  getContext: () => FxContext | null
  boardRef: React.RefObject<HTMLElement | null>
  cols: number
  rows: number
  field: { x: number; y: number }
  glow: boolean
  className?: string
}) {
  const filterId = `fx-${useId().replace(/:/g, '')}`
  const tracks = useRef(new Map<string, { fx: Fx; frame: number }>())
  const timer = useRef(0)
  const hidden = useRef(false)
  const [cells, setCells] = useState<Drawn[]>([])

  useImperativeHandle(ref, () => {
    const tick = () => {
      const ctx = getContext()
      if (!ctx) return
      const drawn: Drawn[] = []
      let hide = false
      const order = [...tracks.current.keys()].sort((a, b) => Number(!a.startsWith('idle:')) - Number(!b.startsWith('idle:')))
      for (const name of order) {
        const track = tracks.current.get(name)!
        const frame = track.fx(track.frame++, ctx)
        // A finished effect hands straight back to the board: its last frame isn't drawn. A one-off
        // effect that never finishes would block clicks, so it's cut off after ~12s.
        if (frame.done || (!name.startsWith('idle:') && track.frame > MAX_FRAMES)) {
          tracks.current.delete(name)
          continue
        }
        if (frame.hideBase) hide = true
        // Later lamps in a frame win a shared position.
        const own = new Map<string, Drawn>()
        for (const cell of frame.cells) {
          if (cell.x < -field.x || cell.x >= cols + field.x || cell.y < -field.y || cell.y >= rows + field.y) continue
          const key = `${name}:${cell.id ?? cellKey(cell.x, cell.y)}`
          own.delete(key)
          own.set(key, { ...cell, key })
        }
        drawn.push(...own.values())
      }
      if (hide !== hidden.current) {
        boardRef.current?.toggleAttribute('data-fx-hide', hide)
        hidden.current = hide
      }
      setCells(drawn)
      if (!tracks.current.size) {
        clearInterval(timer.current)
        timer.current = 0
      }
    }
    return {
      play(track, fx) {
        tracks.current.set(track, { fx, frame: 0 })
        if (!timer.current) timer.current = window.setInterval(tick, TICK_MS)
      },
      stop(track) {
        tracks.current.delete(track)
        if (!timer.current) setCells((list) => list.filter((cell) => !cell.key.startsWith(`${track}:`)))
      },
      busy: (track) => tracks.current.has(track),
    }
  }, [getContext, boardRef, cols, rows, field.x, field.y])

  useEffect(() => () => clearInterval(timer.current), [])

  const lit = cells.filter((cell) => !cell.off)

  return (
    <svg
      viewBox={`${-field.x - 0.5} ${-field.y - 0.5} ${cols + field.x * 2} ${rows + field.y * 2}`}
      className={['led led-fx', className].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      {glow ? (
        <>
          <defs>
            <filter id={filterId} x="-10%" y="-30%" width="120%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="0.35" result="near" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="far" />
              <feMerge>
                <feMergeNode in="far" />
                <feMergeNode in="near" />
              </feMerge>
            </filter>
          </defs>
          <g className="led-fx-halo" filter={`url(#${filterId})`}>
            {lit.map((cell) => (
              <circle key={cell.key} cx={cell.x} cy={cell.y} r={R} style={paint(cell)} />
            ))}
          </g>
        </>
      ) : null}
      {cells.map((cell) =>
        cell.off ? (
          <g key={cell.key}>
            <circle cx={cell.x} cy={cell.y} r={R + 0.06} className="led-fx-dark" />
            <circle cx={cell.x} cy={cell.y} r={R} className="led-off" />
          </g>
        ) : (
          <circle key={cell.key} cx={cell.x} cy={cell.y} r={R} style={paint(cell)} />
        ),
      )}
    </svg>
  )
}
