'use client'

import Lenis from 'lenis'
import Snap from 'lenis/snap'
import 'lenis/dist/lenis.css'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

let active: Lenis | null = null

/** Scrolls the page to `y`, eased through Lenis when it is running. */
export function scrollToY(y: number) {
  if (active) return active.scrollTo(y, { duration: 1.4 })
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' })
}

/**
 * Site-wide eased wheel scrolling. On pages that mark sections with
 * `data-snap`, scrolling that comes to rest near a section start settles onto
 * it, so the page reads as a sequence of panels. Long sections still scroll
 * freely, since proximity snapping only engages close to a boundary.
 *
 * Touch keeps native scrolling, and reduced-motion users get neither smoothing
 * nor snapping.
 */
export function SmoothScroll() {
  const pathname = usePathname()
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ autoRaf: true, lerp: 0.085, anchors: true, stopInertiaOnNavigate: true })
    lenisRef.current = lenis
    active = lenis
    return () => {
      lenis.destroy()
      lenisRef.current = null
      active = null
    }
  }, [])

  // Snap points belong to the page, so they are rebuilt on every navigation.
  useEffect(() => {
    const lenis = lenisRef.current
    const sections = [...document.querySelectorAll<HTMLElement>('[data-snap]')]
    if (!lenis || !sections.length) return
    const snap = new Snap(lenis, {
      type: 'proximity',
      distanceThreshold: '30%',
      debounce: 180,
      duration: 0.9,
      easing: (t) => 1 - Math.pow(1 - t, 4),
    })
    snap.addElements(sections, { align: ['start'] })
    return () => snap.destroy()
  }, [pathname])

  return null
}
