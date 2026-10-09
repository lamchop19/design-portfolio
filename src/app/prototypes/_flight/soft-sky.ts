'use client'

import { useEffect } from 'react'

import { sky, type LegId } from './legs'

/** Stops per fade. Enough that the eased curve reads as a curve, with the grain hiding any steps. */
const STEPS = 8
/** How far a fade reaches past its spacer into the legs either side, as a fraction of the viewport. */
const REACH = 0.12

const smoothstep = (t: number) => t * t * (3 - 2 * t)

/**
 * Paints one continuous sky behind a page of stacked `[data-leg]` sections:
 * each leg's colour holds through its body and fades into the next across a
 * long eased band, mixed in oklab so the midpoints stay clean.
 *
 * A fade covers the `[data-blend]` spacer before a leg, plus a little either
 * side. A leg with no spacer before it fades in from its own top down to the
 * bottom of its `[data-fade-end]` element (or most of a screen without one).
 *
 * The stops name the `--leg-*` colours rather than resolved values, so a theme
 * change recolours the sky without measuring again.
 */
export function useSoftSky(
  rootRef: React.RefObject<HTMLElement | null>,
  skyRef: React.RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const root = rootRef.current
    const el = skyRef.current
    if (!root || !el) return
    let frame = 0

    const paint = () => {
      frame = 0
      const origin = root.getBoundingClientRect().top
      const at = (node: Element, edge: 'top' | 'bottom') => node.getBoundingClientRect()[edge] - origin
      const reach = window.innerHeight * REACH
      const sections = [...root.querySelectorAll<HTMLElement>('[data-leg]')]
      const colours = sections.map((section) => sky(section.dataset.leg as LegId))

      const stops = [`${colours[0]} 0px`]
      for (let i = 1; i < sections.length; i++) {
        const spacer = sections[i].previousElementSibling
        let start: number
        let end: number
        if (spacer?.matches('[data-blend]')) {
          start = at(spacer, 'top') - reach
          end = at(spacer, 'bottom') + reach
        } else {
          const until = sections[i].querySelector('[data-fade-end]')
          start = at(sections[i], 'top')
          end = until ? at(until, 'bottom') : start + window.innerHeight * 0.6
        }
        for (let s = 0; s <= STEPS; s++) {
          const t = s / STEPS
          const mix = (smoothstep(t) * 100).toFixed(1)
          stops.push(`color-mix(in oklab, ${colours[i - 1]}, ${colours[i]} ${mix}%) ${Math.round(start + t * (end - start))}px`)
        }
      }
      el.style.backgroundImage = `linear-gradient(${stops.join(', ')})`
    }
    const schedule = () => {
      frame ||= requestAnimationFrame(paint)
    }

    const resize = new ResizeObserver(schedule)
    resize.observe(root)
    window.addEventListener('resize', schedule)
    paint()
    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
      window.removeEventListener('resize', schedule)
    }
  }, [rootRef, skyRef])
}
