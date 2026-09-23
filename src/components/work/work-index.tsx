'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ViewTransition, useEffect, useRef, useState } from 'react'

import type { WorkMeta } from '@/lib/content'
import type { ImageEntry } from '@/lib/images'

/** Loose enough to lag visibly behind the cursor, tight enough to still track it. */
const followSpring = { stiffness: 340, damping: 34, mass: 0.8 }

export type WorkIndexItem = {
  meta: WorkMeta
  cover: ImageEntry | null
}

/**
 * The work list. Hovering a row raises its cover, which tracks the cursor with
 * spring lag and tilts into the direction of travel. Clicking through morphs that
 * same cover into the case study hero via a shared view-transition name.
 *
 * The spring is hand-rolled rather than pulled from a motion library: this is the
 * home page's only interactive element, and the library cost 43kB gzipped on the
 * critical path to provide it. Pointer behaviour is purely additive — the rows are
 * ordinary links, so keyboard and touch users get a plain, complete list.
 */
export function WorkIndex({ items }: { items: WorkIndexItem[] }) {
  const [active, setActive] = useState<string | null>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  // Kept in refs, not state: these update every frame and must not re-render.
  const target = useRef({ x: 0, y: 0 })
  const current = useRef({ x: 0, y: 0, vx: 0, vy: 0 })
  const hasPosition = useRef(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const { stiffness, damping, mass } = followSpring
    let frame = 0
    let last = performance.now()

    const tick = (now: number) => {
      // Clamp dt so a backgrounded tab doesn't integrate one huge unstable step.
      const dt = Math.min((now - last) / 1000, 1 / 30)
      last = now
      const c = current.current

      for (const axis of ['x', 'y'] as const) {
        const v = axis === 'x' ? 'vx' : 'vy'
        const accel = (-stiffness * (c[axis] - target.current[axis]) - damping * c[v]) / mass
        c[v] += accel * dt
        c[axis] += c[v] * dt
      }

      if (previewRef.current) {
        // Lean into horizontal travel, capped so fast flicks stay readable.
        const tilt = Math.max(-11, Math.min(11, c.vx * 0.012))
        previewRef.current.style.transform =
          `translate3d(${c.x}px, ${c.y}px, 0) rotate(${tilt.toFixed(2)}deg)`
      }

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  function handlePointerMove(event: React.PointerEvent<HTMLUListElement>) {
    if (event.pointerType !== 'mouse') return
    const bounds = listRef.current?.getBoundingClientRect()
    if (!bounds) return
    target.current = { x: event.clientX - bounds.left, y: event.clientY - bounds.top }

    // Jump to the cursor the first time rather than flying in from the corner.
    if (!hasPosition.current) {
      hasPosition.current = true
      current.current = { ...target.current, vx: 0, vy: 0 }
    }
  }

  return (
    <div className="relative">
      <ul
        ref={listRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setActive(null)}
        className="border-t border-rule"
      >
        {items.map(({ meta }) => (
          <li key={meta.slug} className="border-b border-rule">
            <Link
              href={`/work/${meta.slug}`}
              transitionTypes={['nav-forward']}
              onPointerEnter={(event) => {
                if (event.pointerType === 'mouse') setActive(meta.slug)
              }}
              onFocus={() => setActive(null)}
              className="group grid grid-cols-[1fr_auto] items-baseline gap-4 py-6 md:py-8"
            >
              <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="font-display text-[clamp(1.75rem,5vw,3.5rem)] leading-none tracking-tight transition-colors group-hover:text-accent">
                  {meta.title}
                </span>
                <span className="font-mono text-xs tracking-wide text-ink-faint uppercase">
                  {meta.subtitle}
                </span>
              </span>
              <span className="font-mono text-xs text-ink-faint tabular-nums">{meta.year}</span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Cursor-tracked preview. Mouse only, and pointer-events-none so it never
          intercepts the click it is previewing. */}
      <div
        ref={previewRef}
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 z-10 hidden will-change-transform md:block"
      >
        {items.map(({ meta, cover }) =>
          cover ? (
            <div
              key={meta.slug}
              // Every cover stays mounted and is faded in on hover: swapping the
              // mounted node would restart decoding and stutter the first frame.
              className={`absolute -translate-x-1/2 -translate-y-1/2 transition-[opacity,scale] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                active === meta.slug ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
              }`}
            >
              <ViewTransition name={`cover-${meta.slug}`} share="morph" default="none">
                <Image
                  src={cover.src}
                  alt=""
                  width={cover.width}
                  height={cover.height}
                  placeholder="blur"
                  blurDataURL={cover.blurDataURL}
                  sizes="384px"
                  className="h-auto w-[22vw] max-w-[24rem] min-w-[14rem] bg-surface-raised shadow-2xl"
                />
              </ViewTransition>
            </div>
          ) : null,
        )}
      </div>
    </div>
  )
}
