'use client'

import { useEffect, useRef } from 'react'

import { createFishGL, type FishState, MAX_FISH, type SchoolLook } from './fish-gl'

/**
 * A school of fish that follows the pointer, behind the landing, drawn by
 * ./fish-gl. Steered like boids, tuned to glide rather than twitch:
 *
 * - The school chases an eased copy of the pointer, never the raw one.
 * - Steering force is capped, so no fish can change course in one frame.
 * - Fish keep apart with a soft falloff instead of a 1/d² shove.
 * - Heading follows the velocity through a damped spring, so turns ease in and out.
 * - The physics runs in fixed 120 Hz steps whatever the frame rate.
 * - The tail beat follows a smoothed speed.
 *
 * Arriving, there are `look.start` fish. Each click (not on a link, button
 * or the panel) adds `perClick` at the pointer, up to `most`; the click after
 * that scatters them all off screen and the water is empty until the next.
 *
 * Without the pointer for `idleAfter` seconds the scene goes idle, like a
 * menu left running: the school swims a slow lap of the screen in a tighter
 * formation and the ground drifts (and, in the TV style, gets scanlines).
 *
 * With `swim: 'pass'` the school pays the pointer no mind: every `passGap`
 * seconds it swims across the screen on a gentle curve, from one side to the
 * other (alternating, at a new height each time), and waits off screen in
 * between. Clicks still add fish, which swim off to join it; a click while
 * the water is empty brings the next pass on sooner.
 *
 * Reduced motion draws still frames.
 */

type Fish = FishState & {
  /** Its own size within Variety's range, its spot round the pointer, and its quirks. */
  k: number
  ox: number
  oy: number
  spin: number
  pace: number
  wf: number
  wp: number
  /** Turning speed (rad/s) and smoothed swimming speed. */
  w: number
  sp: number
  /** Leaving: seconds since it was scattered. */
  flee?: number
}

const STEP = 1 / 120
const rand = (a: number, b: number) => a + Math.random() * (b - a)

function spawn(x: number, y: number, heading: number, speed: number): Fish {
  return {
    x,
    y,
    vx: Math.cos(heading) * speed,
    vy: Math.sin(heading) * speed,
    a: heading,
    len: 0.03,
    phase: rand(0, 6.28),
    hue: Math.random(),
    k: Math.random(),
    ox: rand(0.02, 0.11),
    oy: rand(0, Math.PI * 2),
    spin: rand(0.5, 1) * (Math.random() < 0.5 ? -1 : 1),
    pace: rand(0.85, 1.12),
    wf: rand(0.25, 0.6),
    wp: rand(0, 6.28),
    w: 0,
    sp: speed,
  }
}

export function FishSchool({ look, className, onCount }: { look: SchoolLook; className?: string; onCount?: (n: number) => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const live = useRef(look)
  const report = useRef(onCount)
  useEffect(() => {
    live.current = look
    report.current = onCount
  }, [look, onCount])

  useEffect(() => {
    const canvas = ref.current
    const fgl = canvas && createFishGL(canvas)
    if (!canvas || !fgl) return

    const onResize = () => fgl.resize()
    window.addEventListener('resize', onResize)

    const anywhere = () => spawn(rand(-0.4, 0.4) * fgl.aspect, rand(-0.35, 0.35), rand(0, 6.28), 0.1)
    const fromEdge = () => {
      const side = Math.random() < 0.5 ? -1 : 1
      return spawn(side * (fgl.aspect / 2 + 0.05), rand(-0.35, 0.35), side > 0 ? Math.PI : 0, 0.15)
    }
    // The passes: which way, where they cross, and when. The first comes on as the intro ends.
    const pass = { dir: Math.random() < 0.5 ? 1 : -1, y0: 0, y1: 0, bend: 0, start: 1.2, dur: 1 }
    const plan = (t: number) => {
      const L = live.current
      pass.y0 = rand(-0.3, 0.3)
      pass.y1 = Math.max(-0.35, Math.min(0.35, pass.y0 + rand(-0.2, 0.2)))
      pass.bend = rand(-0.08, 0.08)
      pass.start = t
      // The edge-to-edge run, at a little under top speed so the school keeps up.
      pass.dur = (fgl.aspect + 0.6) / Math.max(L.speed * 0.75, 0.02)
    }
    plan(1.2)
    const edgeX = (dir: number) => dir * (fgl.aspect / 2 + 0.3)
    /** Where the school is headed in passing mode at time t. */
    const passTarget = (t: number) => {
      const u = (t - pass.start) / pass.dur
      if (u < 0) return { x: edgeX(-pass.dir), y: pass.y0 }
      if (u > 1) return { x: edgeX(pass.dir), y: pass.y1 }
      const s = u * u * (3 - 2 * u)
      return {
        x: edgeX(-pass.dir) + (edgeX(pass.dir) - edgeX(-pass.dir)) * u,
        y: pass.y0 + (pass.y1 - pass.y0) * s + pass.bend * Math.sin(u * Math.PI),
      }
    }
    // In passing mode the first fish wait just off the side the first pass comes from.
    const offstage = () => spawn(edgeX(-pass.dir) + rand(-0.06, 0.06) * -pass.dir, pass.y0 + rand(-0.08, 0.08), pass.dir > 0 ? 0 : Math.PI, 0.1)
    let fish: Fish[] = Array.from({ length: live.current.start }, live.current.swim === 'pass' ? offstage : anywhere)
    let lastStart = live.current.start
    const swimming = () => fish.filter((f) => f.flee === undefined).length
    const tell = () => report.current?.(swimming())
    tell()

    // The pointer, in screen heights from the middle (y up).
    const pointer = { x: 0, y: 0, at: -Infinity }
    const toLocal = (e: PointerEvent) => {
      const box = canvas.getBoundingClientRect()
      return { x: (e.clientX - box.left - box.width / 2) / box.height, y: (box.height / 2 - (e.clientY - box.top)) / box.height }
    }
    const onMove = (e: PointerEvent) => {
      Object.assign(pointer, toLocal(e), { at: performance.now() })
    }
    const onLeave = () => {
      pointer.at = -Infinity
    }
    // A click in the water adds fish at the pointer; past the most, it scatters them.
    const onDown = (e: PointerEvent) => {
      onMove(e)
      if (e.button !== 0 || (e.target as Element | null)?.closest('a, button, input, label, select, textarea, .school-panel')) return
      const L = live.current
      const at = toLocal(e)
      const most = Math.min(L.most, MAX_FISH)
      if (swimming() >= most) {
        for (const f of fish) {
          if (f.flee !== undefined) continue
          f.flee = 0
          const dx = f.x - at.x, dy = f.y - at.y
          const d = Math.hypot(dx, dy) || 1
          f.vx = (dx / d) * L.speed * 1.6
          f.vy = (dy / d) * L.speed * 1.6
        }
      } else {
        const add = Math.min(L.perClick, most - swimming())
        for (let i = 0; i < add; i++) fish.push(spawn(at.x, at.y, rand(0, 6.28), L.speed * 0.8))
        // Passing by, between passes: bring the next one on sooner.
        if (L.swim === 'pass' && clock > pass.start + pass.dur) passSoon = true
      }
      tell()
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)

    const target = { x: 0, y: 0 }
    let idle = 0
    let clock = 0
    let passSoon = false

    const step = (dt: number, t: number, now: number) => {
      const L = live.current
      const aspect = fgl.aspect

      // The Start slider puts the school back to that many; Most trims.
      if (L.start !== lastStart) {
        lastStart = L.start
        fish = fish.filter((f) => f.flee === undefined).slice(0, L.start)
        while (fish.length < L.start) fish.push(fromEdge())
        tell()
      }
      if (swimming() > L.most) {
        fish = fish.slice(0, L.most)
        tell()
      }

      clock = t
      const present = now - pointer.at < L.idleAfter * 1000
      idle += ((present ? 0 : 1) - idle) * (1 - Math.exp(-dt * 0.7))
      const passing = L.swim === 'pass'
      const following = !passing && present
      let rx: number, ry: number
      if (passing) {
        // The next pass comes on `passGap` seconds after this one leaves, the other way.
        const end = pass.start + pass.dur
        if (t > end + (passSoon ? Math.min(L.passGap, 0.6) : L.passGap)) {
          passSoon = false
          pass.dir = -pass.dir
          plan(t)
        }
        ;({ x: rx, y: ry } = passTarget(t))
      } else {
        // Following the pointer, or (idle) a slow lap of the screen, like a screensaver.
        rx = following ? pointer.x : Math.sin(t * 0.09) * aspect * 0.33
        ry = following ? pointer.y : Math.sin(t * 0.14 + 0.6) * 0.24
      }
      const ease = 1 - Math.exp(-dt * (following ? 4.5 : passing ? 6 : 1.2))
      target.x += (rx - target.x) * ease
      target.y += (ry - target.y) * ease

      const top = passing ? L.speed : L.speed * (1 - 0.45 * idle)
      const ring = passing ? 0.3 + 1.4 * L.spread : (0.3 + 2 * L.spread) * (1 - 0.4 * idle)
      const keep = 0.045 * (0.6 + L.spread) * (L.size / 0.028)
      const maxAcc = top * 2.5 + 0.15

      for (const f of fish) {
        f.len = L.size * (1 + L.variety * (f.k * 1.1 - 0.55))
        let ax: number, ay: number
        if (f.flee !== undefined) {
          // Scattering: straight out, speeding up.
          f.flee += dt
          ax = f.vx * 1.5
          ay = f.vy * 1.5
        } else {
          const ang = f.oy + t * f.spin * (0.12 + 0.5 * L.activity)
          const gx = target.x + Math.cos(ang) * f.ox * ring - f.x
          const gy = target.y + Math.sin(ang) * f.ox * ring - f.y
          const dist = Math.hypot(gx, gy) || 1e-6
          // Seek, slowing on arrival.
          const want = top * f.pace * Math.min(1, dist / 0.22)
          ax = ((gx / dist) * want - f.vx) * 2
          ay = ((gy / dist) * want - f.vy) * 2
          // Restlessness: a slow sideways drift of its own.
          const sp0 = Math.hypot(f.vx, f.vy) || 1e-6
          const side = Math.sin(t * f.wf * (0.6 + L.activity) + f.wp) * L.activity * top * 0.9
          ax += (-f.vy / sp0) * side
          ay += (f.vx / sp0) * side
          // Keep apart (softly) and line up with the fish close by.
          let sx = 0, sy = 0, mx = 0, my = 0, near = 0
          for (const o of fish) {
            if (o === f || o.flee !== undefined) continue
            const dx = f.x - o.x, dy = f.y - o.y
            const d = Math.hypot(dx, dy)
            if (d < keep * 2) {
              near++
              mx += o.vx
              my += o.vy
              if (d < keep && d > 1e-6) {
                const w = (1 - d / keep) ** 2
                sx += (dx / d) * w
                sy += (dy / d) * w
              }
            }
          }
          ax += sx * top * 4
          ay += sy * top * 4
          if (near) {
            ax += (mx / near - f.vx) * 0.6
            ay += (my / near - f.vy) * 0.6
          }
          const acc = Math.hypot(ax, ay)
          if (acc > maxAcc) {
            ax *= maxAcc / acc
            ay *= maxAcc / acc
          }
        }
        f.vx += ax * dt
        f.vy += ay * dt
        const sp = Math.hypot(f.vx, f.vy) || 1e-6
        const lim = f.flee !== undefined ? Math.min(sp, 2) : Math.min(Math.max(sp, 0.025), top * f.pace * 1.15)
        f.vx = (f.vx / sp) * lim
        f.vy = (f.vy / sp) * lim
        f.x += f.vx * dt
        f.y += f.vy * dt
        // Heading on a damped spring toward the way it's going.
        let turn = Math.atan2(f.vy, f.vx) - f.a
        turn = Math.atan2(Math.sin(turn), Math.cos(turn))
        const stiff = 16 + 28 * L.activity
        f.w += (turn * stiff - f.w * 2 * Math.sqrt(stiff)) * dt
        f.a += f.w * dt
        f.sp += (lim - f.sp) * (1 - Math.exp(-dt * 4))
        f.phase += dt * (3 + 3 * L.activity + f.sp * 38)
      }
      // Scattered fish go once they're off screen.
      const before = fish.length
      fish = fish.filter((f) => f.flee === undefined || (f.flee < 3 && Math.abs(f.x) < aspect / 2 + 0.4 && Math.abs(f.y) < 0.65))
      if (fish.length !== before) tell()
    }

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let last = performance.now()
    let t = 0
    let acc = 0
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      if (still) {
        // Still frames: the school stays put, but settings and clicks still show.
        step(0, t, now)
      } else {
        acc += dt
        let n = 0
        while (acc >= STEP && n < 12) {
          t += STEP
          step(STEP, t, now)
          acc -= STEP
          n++
        }
        if (n === 12) acc = 0
      }
      fgl.draw(fish, live.current, t, idle)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return <canvas ref={ref} className={className} aria-hidden="true" />
}
