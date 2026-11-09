'use client'

import { useEffect, useRef } from 'react'

import { createFishGL, type FishState, type SchoolLook } from './fish-gl'

/** When the dash starts after the intro mounts, and how long one fish takes to cross the screen (ms). */
export const DASH = { start: 700, cross: 900, stagger: 380 }

/**
 * A preview of the school during the intro: the fish dart across the face of
 * the big mark in a loose shoal, left to right, while its letters resolve.
 * Drawn on a transparent canvas over the intro's dark ground (above the
 * mark), so the fish keep their own colours rather than multiplying. Only
 * while <html data-intro="play">; remount (by key) to run it again.
 */
export function IntroDash({ look }: { look: SchoolLook }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const live = useRef(look)
  useEffect(() => {
    live.current = look
  }, [look])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || document.documentElement.dataset.intro !== 'play') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Shown first, so the canvas has a size to match its pixels to.
    canvas.dataset.live = ''
    const fgl = createFishGL(canvas, { transparent: true, resolution: 0.75 })
    if (!fgl) {
      delete canvas.dataset.live
      return
    }

    // The band the fish cross: the letters of the intro's mark, in screen heights from the middle.
    const letters = document.querySelector('.mal-intro-mark [id="Group 6"]')?.getBoundingClientRect()
    const H = window.innerHeight
    const W = window.innerWidth
    const top = letters ? (H / 2 - letters.top) / H : 0.18
    const bottom = letters ? (H / 2 - letters.bottom) / H : -0.1
    const aspect = W / H

    const L = live.current
    const n = 12
    const size = L.size * 2.2
    const fish = Array.from({ length: n }, () => ({
      delay: Math.random() * DASH.stagger,
      y: bottom + Math.random() * (top - bottom),
      wob: Math.random() * 6.28,
      pace: 0.85 + Math.random() * 0.35,
      k: Math.random(),
      hue: Math.random(),
    }))
    const states: FishState[] = fish.map((f) => ({ x: -9, y: f.y, a: 0, len: size, vx: 0, vy: 0, phase: f.wob, hue: f.hue }))

    const span = aspect + size * 6
    const speed = span / (DASH.cross / 1000)
    const start = performance.now() + DASH.start
    let raf = 0
    const frame = (now: number) => {
      const ms = now - start
      const Lc = live.current
      let any = false
      fish.forEach((f, i) => {
        const s = states[i]
        const local = (ms - f.delay) / 1000
        s.x = -span / 2 + local * speed * f.pace
        s.y = f.y + 0.012 * Math.sin(local * 14 + f.wob)
        s.a = 0.25 * Math.cos(local * 14 + f.wob) * 0.4
        s.vx = speed * f.pace * 0.15
        s.vy = 0
        s.len = Lc.size * 2.2 * (1 + Lc.variety * (f.k * 1.1 - 0.55))
        s.phase = f.wob + local * 40
        if (s.x < span / 2) any = true
      })
      fgl.draw(states, Lc, ms / 1000)
      if (any || ms < 0) raf = requestAnimationFrame(frame)
      else delete canvas.dataset.live
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      delete canvas.dataset.live
    }
  }, [])

  return <canvas ref={ref} className="school-dash" aria-hidden="true" />
}
