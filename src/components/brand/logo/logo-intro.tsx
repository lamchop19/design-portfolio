'use client'

import { useEffect, useRef } from 'react'

import { INTRO_KEY } from '@/lib/intro'

import { getParts, playLoad, playTitleCard } from './effects'

import './logo.css'

/*
 * Milliseconds from when the mark mounts. The Halftone load resolves its last
 * letter at about 1.6s. Under it the title card reads from 0.5s, goes out at
 * 2.3s, and the name comes on at 2.75s; the mark flies home at 3.9s.
 */
const CARD = { on: 500, off: 2300, name: 2750 }
const HOLD_UNTIL = 3900
const FLIGHT = 950
/** A skip still flies the mark home, just faster. */
const QUICK_FLIGHT = 480

/**
 * The homepage's opening, like a feature's titles before the menu: the maL
 * mark on the logo frame's dark ground plays the Halftone load (each letter
 * swells out of a dot screen) while the dotted line under it reads "feature
 * presentation", then gives way to "marc andre lam" (logoSvg's `card`). Then
 * the mark flies into `target`, the guide's mark at the top of the page,
 * dropping the name on the way, while the ground dissolves through the same
 * dot screen onto the page. Without a card, the name flickers on with the load.
 *
 * Once a visit, decided before paint by the head script in lib/intro. Any key,
 * click, wheel or touch skips ahead to the flight. The layer is in the server
 * HTML, so the page never flashes before it, and CSS hides it unless the head
 * script asked for it (and after 8s if the script never takes over).
 */
export function LogoIntro({
  svg,
  target,
  hold = HOLD_UNTIL,
  flight = FLIGHT,
}: {
  svg: string
  target: string
  /** When the mark starts flying home, in ms from mount (the homepage's by default). */
  hold?: number
  /** How long the flight takes, in ms. */
  flight?: number
}) {
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

    const card = parts.card.length > 0
    const stopLoad = playLoad('halftone', parts, { name: !card })
    const stopCard = card ? playTitleCard(parts, CARD) : () => {}
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
      // The page's mark is the monogram alone, so the dotted line fades on the way.
      ;[...parts.name, ...parts.card].forEach((letter) =>
        anims.push(letter.animate([{}, { opacity: 0 }], { duration: ms * 0.4, fill: 'forwards' })),
      )

      const to = document.querySelector(target)?.querySelector('[id="Group 6"]')?.getBoundingClientRect()
      const from = parts.group.getBoundingClientRect()
      const box = host.getBoundingClientRect()
      const move = to?.width
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
      anims.push(move)
      move.onfinish = land
    }

    const timer = window.setTimeout(() => fly(flight), hold)
    events.forEach((type) => window.addEventListener(type, skip, { passive: true }))

    return () => {
      clearTimeout(timer)
      off()
      anims.forEach((a) => a.cancel())
      stopLoad()
      stopCard()
      delete host.dataset.ready
      delete ground.dataset.out
      delete root.dataset.live
      // Torn down before landing (React's dev double-mount does this): set up to play again.
      if (!landed) html.dataset.intro = 'play'
    }
  }, [target, hold, flight])

  return (
    <div ref={layer} className="mal-intro" aria-hidden="true">
      <div className="mal-intro-ground" />
      <div ref={mark} className="mal-intro-mark mal-mark" dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  )
}
