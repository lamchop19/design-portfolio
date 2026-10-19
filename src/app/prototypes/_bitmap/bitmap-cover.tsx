'use client'

import { useEffect, useRef, useState } from 'react'

import { asset } from '@/lib/paths'
import { disciplinesOf } from '@/lib/disciplines'
import { indexLabel, type WorkItem } from '@/lib/work-items'

import { buildField, inksFor, PALETTES, print, printPath, type PaletteId, type PixelSize } from './dither'

export type BitmapMode = 'live' | 'print'

/** How long the dissolve takes when the specimen changes, in ms. */
const SWEEP_MS = 900

const reducedQuery = '(prefers-reduced-motion: reduce)'

/**
 * A project's bitmap specimen filling its frame, with a spec-sheet caption.
 * Live draws it on a canvas at the frame's own size and dissolves each new
 * specimen in through the dither; Print shows the file the build script made
 * (scripts/generate-bitmaps.tsx), with no motion.
 */
export function BitmapCover({
  item,
  index,
  palette,
  pixel,
  mode,
}: {
  item: WorkItem
  /** The project's place in the running order, for the caption. */
  index: number
  palette: PaletteId
  pixel: PixelSize
  mode: BitmapMode
}) {
  const { meta } = item
  const paletteName = PALETTES.find((p) => p.id === palette)!.name

  return (
    <figure className="bm-cover" data-palette={palette}>
      <div className="bm-frame" style={{ '--px': `${pixel}px` } as React.CSSProperties}>
        {mode === 'live' ? (
          <LiveSpecimen item={item} palette={palette} pixel={pixel} />
        ) : (
          // A pixel-for-pixel bitmap, scaled up crisp: image optimisation would only blur it.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={asset(printPath(meta.slug, palette, pixel))} alt="" className="bm-canvas" />
        )}
      </div>
      <figcaption className="bm-caption t-label">
        <span>Specimen — {indexLabel(index)}</span>
        <span className="text-ink-faint">
          {paletteName} · {pixel}px · {mode === 'live' ? 'Live' : 'Print'}
        </span>
      </figcaption>
    </figure>
  )
}

function LiveSpecimen({ item, palette, pixel }: { item: WorkItem; palette: PaletteId; pixel: PixelSize }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)
  const { slug } = item.meta

  // The bitmap is the frame's size in CSS px over the pixel size.
  useEffect(() => {
    const el = canvas.current?.parentElement
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.max(1, Math.round(entry.contentRect.width / pixel))
      const height = Math.max(1, Math.round(entry.contentRect.height / pixel))
      setSize((prev) => (prev?.width === width && prev.height === height ? prev : { width, height }))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [pixel])

  useEffect(() => {
    const el = canvas.current
    const context = el?.getContext('2d')
    if (!el || !context || !size) return
    const { width, height } = size
    el.width = width
    el.height = height
    const field = buildField(slug, width, height)
    const inks = inksFor(palette, disciplinesOf(item.meta))
    const image = context.createImageData(width, height)

    const draw = (progress: number) => {
      print(image.data, field, width, height, inks, progress)
      context.putImageData(image, 0, 0)
    }
    if (window.matchMedia(reducedQuery).matches) {
      draw(1)
      return
    }

    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / SWEEP_MS)
      // Eased out, so the cores arrive fast and the edges settle.
      draw(1 - (1 - t) ** 3)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [slug, item.meta, palette, size])

  return <canvas ref={canvas} className="bm-canvas" aria-hidden="true" />
}
