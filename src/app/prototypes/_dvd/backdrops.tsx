'use client'

import { useEffect, useRef } from 'react'

/*
 * The looping scene behind the menu, three ways, after the moodboard: the Rio
 * Hostel poster's airbrushed fish, the PS3 menu's wave, and the glowing
 * jellies. Fish and jellies are CSS; the wave is a canvas. All hold still
 * under reduced motion. Sized in container units, so a scene fills whatever
 * box it's put in: the whole screen, a window, or a masked bloom. Styles in dvd.css.
 */

export type BackdropId = 'fish' | 'wave' | 'jellies'

export const BACKDROPS: { id: BackdropId; name: string }[] = [
  { id: 'fish', name: 'Airbrush fish' },
  { id: 'wave', name: 'PS3 wave' },
  { id: 'jellies', name: 'Jellies' },
]

export function Backdrop({ kind, className, ref }: { kind: BackdropId; className?: string; ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} className={['dvd-backdrop', className].filter(Boolean).join(' ')} data-kind={kind} aria-hidden="true">
      {kind === 'fish' && <Fish />}
      {kind === 'wave' && <Wave />}
      {kind === 'jellies' && <Jellies />}
      <div className="dvd-grain" />
    </div>
  )
}

/* ---- Airbrush fish ---- */

// A loose school swimming right, stacked like the poster. y and size in % of the scene's height,
// speed in seconds per crossing, delay as a fraction of it so they start spread out.
const SCHOOL = [
  { color: '#f2ff3a', y: 10, size: 34, speed: 46, delay: 0.1 },
  { color: '#1336ff', y: 22, size: 30, speed: 52, delay: 0.55 },
  { color: '#ff3d9a', y: 34, size: 32, speed: 42, delay: 0.3 },
  { color: '#ff5a1f', y: 46, size: 36, speed: 48, delay: 0.8 },
  { color: '#25e46b', y: 56, size: 33, speed: 44, delay: 0.05 },
  { color: '#ff2a2a', y: 68, size: 35, speed: 50, delay: 0.45 },
  { color: '#ff3d9a', y: 80, size: 26, speed: 38, delay: 0.7 },
]

function Fish() {
  return (
    <div className="dvd-fish-tank">
      {SCHOOL.map((f, i) => (
        <div
          key={i}
          className="dvd-fish"
          style={
            {
              '--c': f.color,
              '--y': `${f.y}cqh`,
              '--s': `${f.size}cqh`,
              '--speed': `${f.speed}s`,
              '--delay': `${-f.delay * f.speed}s`,
            } as React.CSSProperties
          }
        >
          <span className="dvd-fish-body" />
          <span className="dvd-fish-eye" />
        </div>
      ))}
    </div>
  )
}

/* ---- PS3 wave ---- */

/** The XMB ribbon: a few translucent sheets and a fan of thin lines, drifting. */
function Wave() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let frame = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const curve = (x: number, t: number, phase: number) =>
      h * 0.56 +
      Math.sin(x * 0.0021 + t * 0.32 + phase) * h * 0.09 +
      Math.sin(x * 0.0057 - t * 0.47 + phase * 2.1) * h * 0.035 +
      Math.sin(x * 0.0009 + t * 0.12) * h * 0.06

    const draw = (ms: number) => {
      const t = ms / 1000
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'

      for (let k = 0; k < 3; k++) {
        ctx.beginPath()
        for (let x = 0; x <= w + 8; x += 8) ctx.lineTo(x, curve(x, t, k * 0.9))
        for (let x = w + 8; x >= 0; x -= 8) ctx.lineTo(x, curve(x, t, k * 0.9 + 0.6) + h * 0.07)
        ctx.closePath()
        ctx.fillStyle = 'rgba(120, 230, 225, 0.07)'
        ctx.fill()
      }

      for (let i = 0; i < 26; i++) {
        ctx.beginPath()
        for (let x = 0; x <= w + 8; x += 8) ctx.lineTo(x, curve(x, t, i * 0.035) + i * 1.6)
        ctx.strokeStyle = `rgba(190, 250, 245, ${0.08 + (i % 5 === 0 ? 0.12 : 0)})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      ctx.globalCompositeOperation = 'source-over'
      if (!still) frame = requestAnimationFrame(draw)
    }

    const observer = new ResizeObserver(() => {
      resize()
      if (still) draw(0)
    })
    observer.observe(canvas)
    resize()
    frame = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

  return (
    <div className="dvd-wave">
      <canvas ref={ref} />
    </div>
  )
}

/* ---- Jellies ---- */

const JELLIES = [
  { x: 12, y: 18, size: 22, a: '#ff7ac8', b: '#ffb45a', speed: 9 },
  { x: 58, y: 8, size: 30, a: '#7af0ff', b: '#3a7bff', speed: 11 },
  { x: 78, y: 46, size: 18, a: '#ffe25a', b: '#ff5a3a', speed: 8 },
  { x: 30, y: 56, size: 26, a: '#9cff6a', b: '#22c6a0', speed: 12 },
  { x: 88, y: 12, size: 14, a: '#ff9af0', b: '#a05aff', speed: 7 },
  { x: 4, y: 70, size: 16, a: '#7af0ff', b: '#ff7ac8', speed: 10 },
]

function Jellies() {
  return (
    <div className="dvd-jellies">
      {JELLIES.map((j, i) => (
        <div
          key={i}
          className="dvd-jelly"
          style={
            {
              '--x': `${j.x}cqw`,
              '--y': `${j.y}cqh`,
              '--s': `${j.size}cqmin`,
              '--a': j.a,
              '--b': j.b,
              '--speed': `${j.speed}s`,
              '--delay': `${-i * 1.7}s`,
            } as React.CSSProperties
          }
        >
          <span className="dvd-jelly-bell" />
          <span className="dvd-jelly-tails" />
        </div>
      ))}
      <div className="dvd-specks" />
    </div>
  )
}
