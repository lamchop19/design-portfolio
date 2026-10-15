'use client'

import { useEffect, useRef } from 'react'

import { useMediaQuery } from '@/app/prototypes/_flight/use-flight'

import { legClass, type LegId } from './legs'

/** A fine pointer and motion allowed: the field follows a mouse, so touch and reduced motion go without. */
const QUERY = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'

/** How far past the wordmark the pointer must be before the field shows, in px (the torch's radius). */
const REACH = 180

/**
 * A board of unlit lamps behind the page, seen only in a soft circle around
 * the pointer, like a torch over a perforated sign face. Everything on the
 * page sits on top of it. It gives way near the wordmark, where the name's own
 * glow takes over, so no grid ever shows behind the name. The dots take the
 * ink of `leg`, the section in view. Decorative.
 */
export function DotField({ leg }: { leg: LegId }) {
  const ref = useRef<HTMLDivElement>(null)
  const enabled = useMediaQuery(QUERY)

  useEffect(() => {
    const field = ref.current
    if (!enabled || !field) return
    let frame = 0
    let x = 0
    let y = 0
    let seen = false

    const nearName = () =>
      [...document.querySelectorAll('.landing-wordmark .ledw')].some((board) => {
        const r = board.getBoundingClientRect()
        return r.width > 0 && x > r.left - REACH && x < r.right + REACH && y > r.top - REACH && y < r.bottom + REACH
      })

    const draw = () => {
      frame = 0
      field.style.setProperty('--mx', `${x}px`)
      field.style.setProperty('--my', `${y}px`)
      field.toggleAttribute('data-on', seen && !nearName())
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(draw)
    }

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      x = event.clientX
      y = event.clientY
      seen = true
      schedule()
    }
    const onLeave = () => {
      seen = false
      schedule()
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    // Scrolling moves the wordmark under a still pointer.
    window.addEventListener('scroll', schedule, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', schedule)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [enabled])

  if (!enabled) return null
  return <div ref={ref} className={`landing-dots ${legClass(leg)}`} aria-hidden="true" />
}
