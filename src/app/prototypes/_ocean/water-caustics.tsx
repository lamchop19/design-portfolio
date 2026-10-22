'use client'

import { useEffect, useRef } from 'react'

import { bayerAt } from '@/lib/dither'

/**
 * Water option B: caustics, the net of light that ripples across a sea bed,
 * drawn live as an ordered dither. One canvas pixel is one dot, scaled up
 * crisp, so it prints in the same grain as the specimens. The net gets denser
 * the further down the page you are.
 *
 * Draws at about 15 fps, stops while the tab is hidden, and holds one still
 * frame under reduced motion.
 */
export function WaterCaustics() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let image: ImageData | null = null
    let ink: [number, number, number] = [58, 91, 160]
    let frame = 0
    let last = 0

    const resize = () => {
      const dot = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dot')) || 2
      canvas.width = Math.ceil(window.innerWidth / dot)
      canvas.height = Math.ceil(window.innerHeight / dot)
      image = context.createImageData(canvas.width, canvas.height)
      const value = getComputedStyle(document.documentElement).getPropertyValue('--ink-blue').trim()
      const n = Number.parseInt(value.slice(1), 16)
      if (!Number.isNaN(n)) ink = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    }

    const draw = (time: number) => {
      if (!image) return
      const { width, height, data } = image
      const t = time / 1000
      const max = document.documentElement.scrollHeight - window.innerHeight
      const depth = max > 0 ? window.scrollY / max : 0
      const strength = 0.35 + depth * 0.65
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          // Four crossing swells; their sum folds into thin bright lines where it nears a whole wave.
          const n =
            Math.sin(x * 0.045 + t * 0.6) +
            Math.sin(y * 0.06 - t * 0.45) +
            Math.sin((x + y) * 0.032 + t * 0.3) +
            Math.sin(Math.hypot(x - width * 0.3, y + 40) * 0.05 - t * 0.8)
          const line = (1 - Math.abs(Math.sin(n * 1.6))) ** 7
          const o = (y * width + x) * 4
          data[o] = ink[0]
          data[o + 1] = ink[1]
          data[o + 2] = ink[2]
          data[o + 3] = line * strength > bayerAt(x, y) ? 255 : 0
        }
      }
      context.putImageData(image, 0, 0)
    }

    const loop = (time: number) => {
      frame = requestAnimationFrame(loop)
      if (time - last < 66) return
      last = time
      draw(time)
    }

    const onVisibility = () => {
      cancelAnimationFrame(frame)
      if (document.visibilityState === 'visible' && !reduced) frame = requestAnimationFrame(loop)
    }

    resize()
    draw(0)
    if (!reduced) frame = requestAnimationFrame(loop)
    const onResize = () => {
      resize()
      draw(last)
    }
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return <canvas ref={canvasRef} className="ocean-caustics" aria-hidden="true" />
}
