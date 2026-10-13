'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

const SPIN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export function randomGlyph() {
  return SPIN[Math.floor(Math.random() * SPIN.length)]
}

const motionQuery = '(prefers-reduced-motion: reduce)'

export function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(motionQuery)
      query.addEventListener('change', onChange)
      return () => query.removeEventListener('change', onChange)
    },
    () => window.matchMedia(motionQuery).matches,
    () => false,
  )
}

export type Stray = { id: number; x: number; y: number; colour: string }

const STRAY_COLOURS = ['var(--brand-blue)', 'var(--brand-pink)', 'var(--brand-green)', '#4d8cff']

/**
 * Stray lamps for the board field: one blinks on somewhere outside the name
 * every so often and goes out again. `cols`/`rows` are the field in lamps,
 * and `hole` the board's own rectangle inside it, which strays avoid.
 */
export function useStrays(
  active: boolean,
  field: { cols: number; rows: number },
  hole: { x: number; y: number; w: number; h: number },
) {
  const [strays, setStrays] = useState<Stray[]>([])

  useEffect(() => {
    if (!active) return
    let next = 0
    const timers = new Set<number>()
    const spawn = () => {
      let x = 0
      let y = 0
      do {
        x = Math.floor(Math.random() * field.cols)
        y = Math.floor(Math.random() * field.rows)
      } while (x >= hole.x - 1 && x < hole.x + hole.w + 1 && y >= hole.y - 1 && y < hole.y + hole.h + 1)
      if (x % 6 === 5) x -= 1
      const stray = { id: next++, x, y, colour: STRAY_COLOURS[Math.floor(Math.random() * STRAY_COLOURS.length)] }
      setStrays((list) => [...list, stray])
      const out = window.setTimeout(() => {
        setStrays((list) => list.filter((s) => s.id !== stray.id))
        timers.delete(out)
      }, 2000)
      timers.add(out)
    }
    const interval = window.setInterval(spawn, 520)
    return () => {
      clearInterval(interval)
      timers.forEach(clearTimeout)
      setStrays([])
    }
  }, [active, field.cols, field.rows, hole.x, hole.y, hole.w, hole.h])

  return strays
}
