'use client'

import { useEffect, useRef } from 'react'

import { sourceKey, type Source } from './options'
import { createPrinter, type PrintParams, type Printer, type Treatment } from './print-gl'

/** How long the print-in takes, in ms: the ink growing from nothing to the resting print. */
const PRINT_MS = 900
/** Developing into colour, and settling back into the print. */
const SWELL_IN_MS = 720
const SWELL_OUT_MS = 520
/** On a new image, how far into the print-in the colour may start to come through. */
const SWELL_AFTER_PRINT_MS = 520
/** The grain reseeds about twelve times a second while it boils, as the logo's Boil does. */
const BOIL_MS = 85

const reducedQuery = '(prefers-reduced-motion: reduce)'

type Settings = { treatment: Treatment; ink: string; ink2: string; pitch: number; paper: string }

/**
 * One cover, printed. It rests as ink on paper and, while `hot`, swells into
 * the full-colour image; a new image (or a new `take`) prints in again from a
 * bare sheet. The parent decides what counts as pointing at it (hovering a
 * row, focusing a link), so the same print works in a list or a grid.
 *
 * Without WebGL2 the plain image shows instead. Under reduced motion the
 * print is drawn at rest and swaps straight to colour.
 */
export function Print({
  source,
  hot,
  treatment,
  ink,
  ink2,
  pitch,
  paper,
  delay = 0,
  take = 0,
  label,
  className,
}: Settings & {
  source: Source
  hot: boolean
  /** ms after the image is ready before the print-in starts. */
  delay?: number
  /** Bump to print in again. */
  take?: number
  label: string
  className?: string
}) {
  const frameRef = useRef<HTMLDivElement>(null)
  const press = useRef<{ printer: Printer; kick: () => void } | null>(null)
  const settings = useRef<Settings>({ treatment, ink, ink2, pitch, paper })
  const anim = useRef({ print: 0, printStart: -1, swell: 0, swellFrom: 0, swellTo: 0, swellStart: 0, seed: 7, lastBoil: 0, ready: false })
  const key = sourceKey(source)

  // The press: one WebGL2 context for the print's life, drawn on demand. Its
  // canvas is made here rather than rendered, so each run of the effect gets a
  // fresh context (a canvas keeps its first one, even once it's been lost).
  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const canvas = document.createElement('canvas')
    canvas.setAttribute('aria-hidden', 'true')
    frame.prepend(canvas)
    let printer: Printer | null = null
    try {
      printer = createPrinter(canvas)
    } catch (error) {
      console.warn('Screen print: the press could not start, showing the plain image.', error)
      printer = null
    }
    if (!printer) {
      frame.dataset.press = 'off'
      canvas.remove()
      return
    }
    frame.dataset.press = 'on'
    const still = window.matchMedia(reducedQuery).matches
    let raf = 0

    const tick = (now: number) => {
      const a = anim.current
      const s = settings.current
      let busy = false
      if (a.printStart >= 0 && a.print < 1) {
        const t = Math.min(1, Math.max(0, (now - a.printStart) / PRINT_MS))
        a.print = 1 - (1 - t) ** 3
        busy = t < 1
      }
      if (a.swell !== a.swellTo) {
        const rising = a.swellTo > a.swellFrom
        const t = Math.min(1, Math.max(0, (now - a.swellStart) / (rising ? SWELL_IN_MS : SWELL_OUT_MS)))
        // Eased in and out, so the dots are seen to grow before they merge.
        const e = 0.5 - Math.cos(Math.PI * t) / 2
        a.swell = t >= 1 ? a.swellTo : a.swellFrom + (a.swellTo - a.swellFrom) * e
        busy ||= t < 1
      }
      if (s.treatment === 'grain' && a.swellTo === 1 && !still) {
        if (now - a.lastBoil > BOIL_MS) {
          a.seed = Math.floor(Math.random() * 997)
          a.lastBoil = now
        }
        busy = true
      }
      printer.draw({ ...s, print: a.print, swell: a.swell, seed: a.seed } satisfies PrintParams)
      raf = busy ? requestAnimationFrame(tick) : 0
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }

    const observer = new ResizeObserver(([entry]) => {
      printer.resize(entry.contentRect.width, entry.contentRect.height)
      kick()
    })
    observer.observe(frame)
    const lost = (event: Event) => {
      event.preventDefault()
      frame.dataset.press = 'off'
    }
    canvas.addEventListener('webglcontextlost', lost)
    press.current = { printer, kick }

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      canvas.removeEventListener('webglcontextlost', lost)
      printer.destroy()
      canvas.remove()
      press.current = null
    }
  }, [])

  useEffect(() => {
    settings.current = { treatment, ink, ink2, pitch, paper }
    press.current?.kick()
  }, [treatment, ink, ink2, pitch, paper])

  // A new image: load it, then print it in from a bare sheet. If it's pointed
  // at, the colour comes through once the ink is mostly down.
  useEffect(() => {
    let cancelled = false
    const ready = (image: TexImageSource & { width: number; height: number }, level = true) => {
      const p = press.current
      if (cancelled || !p) return
      p.printer.setImage(image, level)
      const a = anim.current
      const still = window.matchMedia(reducedQuery).matches
      a.ready = true
      a.print = still ? 1 : 0
      a.printStart = still ? -1 : performance.now() + delay
      a.swellFrom = 0
      a.swell = still ? a.swellTo : 0
      a.swellStart = a.printStart + SWELL_AFTER_PRINT_MS
      p.kick()
    }

    if (source.kind === 'fill') {
      ready(drawFill(source), false)
      return
    }
    const image = new Image()
    image.decoding = 'async'
    image.src = source.src
    image
      .decode()
      .then(() => ready(image))
      .catch(() => {
        if (frameRef.current) frameRef.current.dataset.press = 'off'
      })
    return () => {
      cancelled = true
    }
    // The key stands for the source; delay only matters at the moment the image lands.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  // Print again on request, or when the treatment changes.
  useEffect(() => {
    const a = anim.current
    if (!a.ready || window.matchMedia(reducedQuery).matches) return
    a.print = 0
    a.printStart = performance.now()
    a.swellFrom = 0
    a.swell = 0
    a.swellStart = a.printStart + SWELL_AFTER_PRINT_MS
    press.current?.kick()
  }, [take, treatment])

  useEffect(() => {
    const a = anim.current
    const to = hot ? 1 : 0
    if (a.swellTo === to) return
    a.swellTo = to
    if (window.matchMedia(reducedQuery).matches) a.swell = to
    a.swellFrom = a.swell
    // Never before the print has had its head start.
    a.swellStart = Math.max(performance.now(), a.printStart + SWELL_AFTER_PRINT_MS)
    press.current?.kick()
  }, [hot])

  return (
    <div ref={frameRef} className={['sp-frame', className].filter(Boolean).join(' ')} role="img" aria-label={label}>
      {source.kind === 'url' && (
        // The fallback where the press can't run: the plain image, full colour.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={source.src} alt="" decoding="async" />
      )}
    </div>
  )
}

/** The site's placeholder for a project without artwork, as an image the press can print: a brand fill and its number. */
function drawFill({ fill, ink, label }: { fill: string; ink: string; label: string }) {
  const canvas = document.createElement('canvas')
  canvas.width = 800
  canvas.height = 1000
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = fill
  ctx.fillRect(0, 0, 800, 1000)
  const family = getComputedStyle(document.documentElement).getPropertyValue('--font-paper-mono').trim() || 'monospace'
  ctx.fillStyle = ink
  ctx.font = `500 300px ${family}`
  ctx.textBaseline = 'top'
  ctx.fillText(label, 56, 56)
  return canvas
}
