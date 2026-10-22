'use client'

import { useEffect, useRef, useState } from 'react'

import { asset } from '@/lib/paths'
import { motionFile, SCENE_SIZE, sceneFile, type SceneMeta } from '@/lib/scenes'

/** What scripts/generate-scenes.tsx writes beside each still (scripts/scenes/kit.ts has the types). */
type Twinkle = [x: number, y: number, r: number, colour: string]
type Sprite = { file: string; x: number; y: number; w: number; motion: 'fly' | 'drift' | 'bob' | 'sway'; speed?: number }
export type Hotspot = { id: string; x: number; y: number; w: number; h: number }
type Motion = { twinkles?: Twinkle[]; sprites?: Sprite[]; hotspots?: Hotspot[] }

const ASPECT = SCENE_SIZE.width / SCENE_SIZE.height

/**
 * A scene, cropped to fill its box like object-fit: cover, keeping its focus
 * point in frame. The still sits on a stage the size of the cropped picture,
 * so its moving parts (twinkles, sprites) and hotspots are placed in the
 * picture's own coordinates whatever the box. `motion` plays them;
 * reduced motion keeps the still. `renderHotspot` draws over a hotspot (the
 * record store's signs).
 */
export function ScenePlayer({
  scene,
  variant,
  motion,
  className,
  renderHotspot,
}: {
  scene: SceneMeta
  variant: string
  motion: boolean
  className?: string
  renderHotspot?: (spot: Hotspot) => React.ReactNode
}) {
  const [data, setData] = useState<Motion>({})
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let live = true
    fetch(asset(motionFile(scene.id, variant)))
      .then((r) => (r.ok ? r.json() : {}))
      .then((json: Motion) => live && setData(json))
      .catch(() => live && setData({}))
    return () => {
      live = false
    }
  }, [scene.id, variant])

  // Twinkles: each dot flashes now and then, on its own beat.
  useEffect(() => {
    const el = canvas.current
    const ctx = el?.getContext('2d')
    const list = data.twinkles
    if (!el || !ctx || !list?.length || !motion || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      ctx?.clearRect(0, 0, el?.width ?? 0, el?.height ?? 0)
      return
    }
    const beats = list.map((_, i) => ({ phase: (i * 2.399) % (Math.PI * 2), speed: 0.6 + ((i * 7919) % 100) / 70 }))
    let frame = 0
    let visible = true
    const size = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      el.width = Math.round(el.clientWidth * dpr)
      el.height = Math.round(el.clientHeight * dpr)
    }
    const draw = (now: number) => {
      const w = el.width
      const h = el.height
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'
      const t = now / 1000
      for (let i = 0; i < list.length; i++) {
        const [x, y, r, colour] = list[i]
        // Mostly dark, now and then a bright flash: a sine raised to a high power.
        const flash = Math.pow(Math.max(0, Math.sin(t * beats[i].speed + beats[i].phase)), 8)
        if (flash < 0.02) continue
        const px = x * w
        const py = y * h
        const pr = Math.max(1.2, r * w) * (1 + flash)
        ctx.globalAlpha = flash
        ctx.fillStyle = colour
        ctx.beginPath()
        ctx.arc(px, py, pr, 0, Math.PI * 2)
        ctx.fill()
        // A soft cross of light on the brightest.
        if (flash > 0.6) {
          ctx.globalAlpha = (flash - 0.6) * 1.2
          ctx.fillRect(px - pr * 3, py - 0.6, pr * 6, 1.2)
          ctx.fillRect(px - 0.6, py - pr * 3, 1.2, pr * 6)
        }
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
      if (visible) frame = requestAnimationFrame(draw)
    }
    const resize = new ResizeObserver(size)
    resize.observe(el)
    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      cancelAnimationFrame(frame)
      if (visible) frame = requestAnimationFrame(draw)
    })
    seen.observe(el)
    size()
    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
      seen.disconnect()
    }
  }, [data.twinkles, motion])

  const [fx, fy] = scene.focus
  return (
    <div className={['sc-player', className].filter(Boolean).join(' ')} style={{ '--fx': fx, '--fy': fy, '--aspect': ASPECT } as React.CSSProperties}>
      <div className="sc-stage">
        {/* eslint-disable-next-line @next/next/no-img-element -- a generated still in public/, shown as is */}
        <img className="sc-still" src={asset(sceneFile(scene.id, variant))} alt="" decoding="async" />
        {data.sprites?.map((sprite) => (
          // eslint-disable-next-line @next/next/no-img-element -- a generated layer in public/
          <img
            key={sprite.file}
            className="sc-sprite"
            data-motion={motion ? sprite.motion : undefined}
            src={asset(sceneFile(scene.id, variant, sprite.file))}
            alt=""
            style={{ '--x': sprite.x, '--y': sprite.y, '--w': sprite.w, '--speed': sprite.speed ?? 1 } as React.CSSProperties}
          />
        ))}
        <canvas ref={canvas} className="sc-twinkles" aria-hidden="true" />
        {renderHotspot &&
          data.hotspots?.map((spot) => (
            <div key={spot.id} className="sc-hotspot" style={{ left: `${spot.x * 100}%`, top: `${spot.y * 100}%`, width: `${spot.w * 100}%`, height: `${spot.h * 100}%` }}>
              {renderHotspot(spot)}
            </div>
          ))}
      </div>
    </div>
  )
}
