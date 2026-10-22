'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { indexLabel, type WorkItem } from '@/lib/work-items'

import { useCentred } from './centred'
import { inkOf, PAPER, sourceOf, type ImageryId, type InkId, type Pitch } from './options'
import { Print } from './print'
import type { Treatment } from './print-gl'

/** The flood in, and the dots clearing off the new page. */
const FLOOD_IN_MS = 560
const FLOOD_OUT_MS = 680
/** How far behind the first dots the last ones start, as a share of the run: the wave. */
const SPREAD = 0.55

const reducedQuery = '(prefers-reduced-motion: reduce)'

/*
 * The cut between the work and a case study, in the press's own screen.
 * Picking a cover floods the screen with its ink as a growing dot screen,
 * spreading from where you clicked; with the page covered the case study is
 * swapped in, and the dots shrink away from the same point to print it. Back
 * runs the same cut from the pill.
 *
 * On the real site this would be the route change itself. The work links
 * would carry transitionTypes={['print-cut']}, and the case study's page would
 * wrap its content in <ViewTransition enter={{ 'print-cut': 'print-cut' }} ...>.
 * The CSS then animates ::view-transition-new(.print-cut) through a mask of
 * dots, a radial-gradient tiled at the pitch whose radius is a registered
 * @property animated from 0 past half the cell's diagonal. That's a
 * uniform screen. The wave from the click point needs this canvas, laid over
 * the page by the link's click handler before router.push.
 */
export function Cut({
  items,
  imagery,
  treatment,
  inkChoice,
  pitch,
  take,
}: {
  items: WorkItem[]
  imagery: ImageryId
  treatment: Treatment
  inkChoice: InkId
  pitch: Pitch
  take: number
}) {
  const [open, setOpen] = useState<number | null>(null)
  const [hot, setHot] = useState<number | null>(null)
  const [developed, setDeveloped] = useState(false)
  const floodRef = useRef<HTMLCanvasElement>(null)
  const running = useRef(false)
  const [centred, setCentred] = useState<number[]>([])
  useCentred('.sp-scene', setCentred, open)

  const cut = useCallback(
    async (next: number | null, origin: { x: number; y: number }, ink: string) => {
      const canvas = floodRef.current
      if (running.current || !canvas) return
      running.current = true
      setDeveloped(false)
      if (window.matchMedia(reducedQuery).matches) {
        setOpen(next)
        window.scrollTo(0, 0)
        running.current = false
        if (next !== null) setDeveloped(true)
        return
      }
      const cell = pitch * 3
      await flood(canvas, { ink, origin, cell, direction: 'in', duration: FLOOD_IN_MS })
      setOpen(next)
      setHot(null)
      window.scrollTo(0, 0)
      // Two frames, so the new page has painted under the ink before it's uncovered.
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      await flood(canvas, { ink, origin, cell, direction: 'out', duration: FLOOD_OUT_MS })
      running.current = false
      // The print develops once the page is clear.
      if (next !== null) window.setTimeout(() => setDeveloped(true), 380)
    },
    [pitch],
  )

  const back = useCallback(
    (from?: HTMLElement | null) => {
      if (open === null) return
      const box = from?.getBoundingClientRect()
      const origin = box ? { x: box.left + box.width / 2, y: box.top + box.height / 2 } : { x: 32, y: 32 }
      cut(null, origin, inkOf(inkChoice, items[open].meta).ink)
    },
    [open, cut, inkChoice, items],
  )

  useEffect(() => {
    if (open === null) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Backspace') back(document.querySelector<HTMLElement>('.sp-back'))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, back])

  const project = open === null ? null : items[open]

  return (
    <div className="sp-cut">
      {project && open !== null ? (
        <article className="sp-case swiss-grid" aria-labelledby="sp-case-title">
          <div className="col-span-full">
            <button type="button" className="sp-back t-label" onClick={(event) => back(event.currentTarget)}>
              ◀ Work
            </button>
          </div>
          <header className="sp-case-head col-span-full md:col-span-7">
            <p className="t-label text-ink-faint">
              {indexLabel(open)} · {project.meta.subtitle} · {project.meta.year}
            </p>
            <h1 id="sp-case-title" className="sp-case-title">
              {project.meta.title}
            </h1>
            <p className="sp-case-headline">{project.meta.headline}</p>
          </header>
          <dl className="sp-case-facts t-label col-span-full md:col-span-4 md:col-start-9">
            {(
              [
                ['Role', project.meta.role],
                ['Timeline', project.meta.timeline],
                ['Team', project.meta.team],
                ['Client', project.meta.client],
              ] as const
            ).map(([term, value]) => (
              <div key={term}>
                <dt className="text-ink-faint">{term}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="sp-case-cover col-span-full">
            <Print
              source={sourceOf(imagery, project.meta, project.cover, open)}
              hot={developed}
              treatment={treatment}
              pitch={pitch}
              paper={PAPER}
              take={take}
              label={project.meta.title}
              {...inkOf(inkChoice, project.meta)}
            />
          </div>
        </article>
      ) : (
        <section className="sp-menu swiss-grid" aria-labelledby="sp-menu-title">
          <p className="t-label col-span-full text-ink-faint md:col-span-3">Scene selection</p>
          <h1 id="sp-menu-title" className="sp-menu-title col-span-full md:col-span-9">
            Work
          </h1>
          <ol className="sp-menu-grid col-span-full">
            {items.map((item, i) => {
              const { ink, ink2 } = inkOf(inkChoice, item.meta)
              return (
                <li key={item.meta.slug}>
                  <button
                    type="button"
                    className="sp-scene"
                    onPointerEnter={() => setHot(i)}
                    onPointerLeave={() => setHot(null)}
                    onFocus={() => setHot(i)}
                    onBlur={() => setHot(null)}
                    onClick={(event) => {
                      // A keyboard press has no pointer position: start from the print's middle.
                      const box = event.currentTarget.getBoundingClientRect()
                      const origin = event.detail ? { x: event.clientX, y: event.clientY } : { x: box.left + box.width / 2, y: box.top + box.height / 3 }
                      cut(i, origin, ink)
                    }}
                  >
                    <Print
                      source={sourceOf(imagery, item.meta, item.cover, i)}
                      hot={hot === i || centred.includes(i)}
                      treatment={treatment}
                      ink={ink}
                      ink2={ink2}
                      pitch={pitch}
                      paper={PAPER}
                      delay={i * 140}
                      take={take}
                      label={item.meta.title}
                    />
                    <span className="sp-scene-caption t-label">
                      <span>
                        {indexLabel(i)} {item.meta.title}
                      </span>
                      <span className="text-ink-faint">{item.meta.year}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      <canvas ref={floodRef} className="sp-flood" aria-hidden="true" />
    </div>
  )
}

/**
 * Runs the dot screen over the whole viewport: in, the ink's dots grow from
 * the origin outwards until they merge into a flat sheet of ink; out, they
 * shrink away, the hole opening at the origin first. Resolves when done.
 */
function flood(
  canvas: HTMLCanvasElement,
  { ink, origin, cell, direction, duration }: { ink: string; origin: { x: number; y: number }; cell: number; direction: 'in' | 'out'; duration: number },
) {
  return new Promise<void>((resolve) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return resolve()
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    const width = window.innerWidth
    const height = window.innerHeight
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    canvas.dataset.on = ''
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // Dot centres on a 45° screen covering the viewport, each with its distance from the origin.
    const dots: { x: number; y: number; d: number }[] = []
    const c = Math.SQRT1_2
    const corners = [
      [0, 0],
      [width, 0],
      [0, height],
      [width, height],
    ]
    // Into screen space (rotated -45°) to find the range of cells to walk.
    const us = corners.map(([x, y]) => (x * c + y * c) / cell)
    const vs = corners.map(([x, y]) => (-x * c + y * c) / cell)
    const far = Math.max(...corners.map(([x, y]) => Math.hypot(x - origin.x, y - origin.y)))
    for (let i = Math.floor(Math.min(...us)) - 1; i <= Math.ceil(Math.max(...us)); i++) {
      for (let j = Math.floor(Math.min(...vs)) - 1; j <= Math.ceil(Math.max(...vs)); j++) {
        const u = (i + 0.5) * cell
        const v = (j + 0.5) * cell
        const x = u * c - v * c
        const y = u * c + v * c
        if (x < -cell || y < -cell || x > width + cell || y > height + cell) continue
        dots.push({ x, y, d: Math.hypot(x - origin.x, y - origin.y) / far })
      }
    }

    const full = cell * 0.74
    const start = performance.now()
    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const e = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = ink
      if (direction === 'in' && t === 1) {
        ctx.fillRect(0, 0, width, height)
        return resolve()
      }
      ctx.beginPath()
      for (const dot of dots) {
        // Each dot runs its own share of the clock, later the further it is from the
        // origin: the ink spreads out from the click, and the hole opens there too.
        const local = Math.min(1, Math.max(0, e * (1 + SPREAD) - dot.d * SPREAD))
        const r = (direction === 'in' ? local : 1 - local) * full
        if (r < 0.4) continue
        ctx.moveTo(dot.x + r, dot.y)
        ctx.arc(dot.x, dot.y, r, 0, Math.PI * 2)
      }
      ctx.fill()
      if (t < 1) requestAnimationFrame(frame)
      else {
        delete canvas.dataset.on
        resolve()
      }
    }
    requestAnimationFrame(frame)
  })
}
