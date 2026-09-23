'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ViewTransition, useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react'

import type { WorkMeta } from '@/lib/content'
import type { ImageEntry } from '@/lib/images'
import { duration, easeOut, followSpring } from '@/lib/motion'

export type WorkIndexItem = {
  meta: WorkMeta
  cover: ImageEntry | null
}

/**
 * The work list. Hovering a row raises its cover, which tracks the cursor with
 * spring lag and tilts into the direction of travel. Clicking through morphs that
 * same cover into the case study hero via a shared view-transition name.
 *
 * Pointer-driven behaviour is additive: the rows are ordinary links, so keyboard
 * and touch users get a plain, complete list.
 */
export function WorkIndex({ items }: { items: WorkIndexItem[] }) {
  const [active, setActive] = useState<string | null>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, followSpring)
  const springY = useSpring(y, followSpring)

  // Tilt proportional to horizontal velocity, so the preview leans into the move.
  const velocityX = useVelocity(springX)
  const rotate = useSpring(
    useTransform(velocityX, [-1600, 0, 1600], [-11, 0, 11], { clamp: true }),
    followSpring,
  )

  function handlePointerMove(event: React.PointerEvent<HTMLUListElement>) {
    if (event.pointerType !== 'mouse') return
    const bounds = listRef.current?.getBoundingClientRect()
    if (!bounds) return
    x.set(event.clientX - bounds.left)
    y.set(event.clientY - bounds.top)
  }

  const activeItem = items.find((item) => item.meta.slug === active) ?? null

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

      {/* Cursor-tracked preview. Mouse only — pointer-events-none so it never
          intercepts the click it is previewing. */}
      <motion.div
        aria-hidden
        style={{ x: springX, y: springY, rotate }}
        className="pointer-events-none absolute top-0 left-0 z-10 hidden md:block"
      >
        <AnimatePresence>
          {activeItem?.cover ? (
            <motion.div
              key={activeItem.meta.slug}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: duration.base, ease: easeOut }}
              // Centres the preview on the cursor.
              className="-translate-x-1/2 -translate-y-1/2"
            >
              <ViewTransition name={`cover-${activeItem.meta.slug}`} share="morph" default="none">
                <Image
                  src={activeItem.cover.src}
                  alt=""
                  width={activeItem.cover.width}
                  height={activeItem.cover.height}
                  placeholder="blur"
                  blurDataURL={activeItem.cover.blurDataURL}
                  sizes="384px"
                  className="h-auto w-[22vw] max-w-[24rem] min-w-[14rem] bg-surface-raised shadow-2xl"
                />
              </ViewTransition>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
