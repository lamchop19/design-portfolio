'use client'

import { useEffect, useRef } from 'react'

import { NameHero } from '@/components/brand/name-hero'
import { FlapText } from '@/components/split-flap/split-flap'
import { wordmarkMotion } from '@/lib/flap-motion'
import { site } from '@/../content/site'

import './intro.css'

/** When the lit name leaves for its tile, and how long the flight takes, in ms. */
export const LED_FLY_AT = 1100
export const LED_FLY_MS = 700
/** When the whole intro is over, so later reveals can follow it. */
export const LED_DONE_AT = LED_FLY_AT + LED_FLY_MS

const reducedQuery = '(prefers-reduced-motion: reduce)'
const BLOCKED = ['wheel', 'touchmove'] as const

/**
 * The full-screen intro: the name lights up lamp by lamp across the whole
 * screen, then shrinks and flies onto the page's own wordmark (`target`, a
 * selector; it lights up underneath, hidden) while the ground fades away. A
 * click or any key skips it. `onDone(skipped)` fires once, when it's over.
 *
 * With `once` (a sessionStorage key) it plays once a visit: once it has run,
 * later mounts skip straight to the end.
 */
export function LedPreroll({
  target,
  once,
  onDone,
}: {
  target: string
  once?: string
  onDone: (skipped: boolean) => void
}) {
  const layer = useRef<HTMLDivElement>(null)
  const mark = useRef<HTMLDivElement>(null)
  const ground = useRef<HTMLDivElement>(null)
  const caption = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    let over = false
    let flights: Animation[] = []
    const finish = (skipped: boolean) => {
      if (over) return
      over = true
      if (once) remember(once)
      onDone(skipped)
    }
    if (window.matchMedia(reducedQuery).matches || (once && seen(once))) {
      finish(true)
      return
    }

    // Hold the page still without touching overflow, so no scrollbar comes or goes under the flight.
    window.scrollTo(0, 0)
    const block = (event: Event) => {
      event.preventDefault()
      event.stopPropagation()
    }
    BLOCKED.forEach((type) => window.addEventListener(type, block, { capture: true, passive: false }))

    const skip = () => {
      flights.forEach((flight) => flight.cancel())
      finish(true)
    }
    window.addEventListener('keydown', skip)
    const el = layer.current
    el?.addEventListener('pointerdown', skip)

    const timer = window.setTimeout(() => {
      const from = mark.current
      const to = document.querySelector<HTMLElement>(target)
      if (!from || !to || !ground.current) return finish(false)
      const a = from.getBoundingClientRect()
      const b = to.getBoundingClientRect()
      // Eased in and out, so the flight reads as a move rather than a cut.
      const ease = 'cubic-bezier(0.7, 0, 0.2, 1)'
      const fly = from.animate(
        [{ transform: 'none' }, { transform: `translate(${b.left - a.left}px, ${b.top - a.top}px) scale(${b.width / a.width})` }],
        { duration: LED_FLY_MS, easing: ease, fill: 'forwards' },
      )
      flights = [
        fly,
        ground.current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: LED_FLY_MS - 150, delay: 120, easing: 'ease-out', fill: 'forwards' }),
        ...(caption.current ? [caption.current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' })] : []),
      ]
      fly.onfinish = () => finish(false)
    }, LED_FLY_AT)

    return () => {
      clearTimeout(timer)
      flights.forEach((flight) => flight.cancel())
      BLOCKED.forEach((type) => window.removeEventListener(type, block, { capture: true }))
      window.removeEventListener('keydown', skip)
      el?.removeEventListener('pointerdown', skip)
    }
  }, [target, once, onDone])

  return (
    <div ref={layer} className="intro-led" aria-hidden="true" data-lenis-prevent>
      <div ref={ground} className="intro-led-ground" />
      <div ref={mark} className="intro-led-mark">
        <NameHero name={site.name} face="led" stack="narrow" motion={wordmarkMotion} intro="auto" />
      </div>
      <p ref={caption} className="intro-led-caption t-label">
        <FlapText text="NOW BOARDING / GATE 01" intro="quick" delay={250} />
      </p>
    </div>
  )
}

function seen(key: string) {
  try {
    return sessionStorage.getItem(key) !== null
  } catch {
    return false
  }
}

function remember(key: string) {
  try {
    sessionStorage.setItem(key, '1')
  } catch {}
}
