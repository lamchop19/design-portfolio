'use client'

import { useEffect, useRef } from 'react'

import { INTRO_KEY } from '@/lib/intro'

import { getParts, playLoad } from './effects'

import './logo.css'

/* Milliseconds from when the mark mounts. The Halftone load resolves its last letter at about 1.6s. */
const HOLD_UNTIL = 2000
const FLIGHT = 950
/** A skip still flies the mark home, just faster. */
const QUICK_FLIGHT = 480

/**
 * The homepage's opening, like a disc's studio ident before its menu: the
 * maL mark on the logo frame's dark ground plays the Halftone load (each
 * letter swells out of a dot screen, the dotted name flickers on), then flies
 * into `target`, the frame's mark in the top-left pill, while the ground
 * dissolves through the same dot screen onto the page.
 *
 * Once a visit, decided before paint by the head script in lib/intro. Any key,
 * click, wheel or touch skips ahead to the flight. The layer is in the server
 * HTML, so the page never flashes before it, and CSS hides it unless the head
 * script asked for it (and after 8s if the script never takes over).
 */
export function LogoIntro({ svg, target }: { svg: string; target: string }) {
  const layer = useRef<HTMLDivElement>(null)
  const mark = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const html = document.documentElement
    const root = layer.current
    const host = mark.current
    const ground = root?.querySelector<HTMLElement>('.mal-intro-ground')
    const parts = host && getParts(host)
    if (html.dataset.intro !== 'play' || !root || !host || !ground || !parts) return

    root.dataset.live = ''
    try {
      sessionStorage.setItem(INTRO_KEY, '1')
    } catch {}

    const stopLoad = playLoad('halftone', parts)
    host.dataset.ready = ''
    const anims: Animation[] = []
    const events = ['keydown', 'pointerdown', 'wheel', 'touchstart'] as const
    let landed = false
    let flying = false

    function skip() {
      fly(QUICK_FLIGHT)
    }

    function off() {
      events.forEach((type) => window.removeEventListener(type, skip))
    }

    function land() {
      landed = true
      off()
      // The frame's mark shows and this layer goes, in the same frame.
      delete html.dataset.intro
    }

    function fly(ms: number) {
      if (flying || !host || !ground || !parts) return
      flying = true
      clearTimeout(timer)
      html.dataset.intro = 'dock'
      ground.style.setProperty('--out', `${Math.round(ms * 0.8)}ms`)
      ground.dataset.out = ''
      // The frame's mark is the monogram alone, so the dotted name fades on the way.
      parts.name.forEach((letter) => anims.push(letter.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms * 0.4, fill: 'forwards' })))

      const to = document.querySelector(target)?.querySelector('[id="Group 6"]')?.getBoundingClientRect()
      const from = parts.group.getBoundingClientRect()
      const box = host.getBoundingClientRect()
      const flight = to?.width
        ? // FLIP: scale about the top-left corner so the letters land exactly on the frame's.
          host.animate(
            [
              { transform: 'none' },
              {
                transform: `translate(${to.left - box.left - (from.left - box.left) * (to.width / from.width)}px, ${to.top - box.top - (from.top - box.top) * (to.width / from.width)}px) scale(${to.width / from.width})`,
              },
            ],
            { duration: ms, easing: 'cubic-bezier(0.7, 0, 0.2, 1)', fill: 'forwards' },
          )
        : // No frame to land in: fade out where it stands.
          host.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(0.97)' }], { duration: ms, easing: 'ease-in', fill: 'forwards' })
      anims.push(flight)
      flight.onfinish = land
    }

    const timer = window.setTimeout(() => fly(FLIGHT), HOLD_UNTIL)
    events.forEach((type) => window.addEventListener(type, skip, { passive: true }))

    return () => {
      clearTimeout(timer)
      off()
      anims.forEach((a) => a.cancel())
      stopLoad()
      delete host.dataset.ready
      delete ground.dataset.out
      delete root.dataset.live
      // Torn down before landing (React's dev double-mount does this): set up to play again.
      if (!landed) html.dataset.intro = 'play'
    }
  }, [target])

  return (
    <div ref={layer} className="mal-intro" aria-hidden="true">
      <div className="mal-intro-ground" />
      <div ref={mark} className="mal-intro-mark mal-mark" dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  )
}
