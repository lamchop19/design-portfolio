'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

import { NameHero } from '@/components/brand/name-hero'
import { WorkCover } from '@/components/home/work-cover'
import { LED_FLY_AT, LedPreroll } from '@/components/intro/led-preroll'
import { GridOverlay } from '@/components/layout/grid-overlay'
import { WindowShade } from '@/components/layout/window-shade'
import { roles } from '@/components/landing/legs'
import { wordmarkMotion } from '@/lib/flap-motion'
import { LED_INTRO_KEY } from '@/lib/intro'
import { asset } from '@/lib/paths'
import type { WorkItem } from '@/lib/work-items'
import { site } from '@/../content/site'

import './ruled-index.css'

export type IndexIntro = 'led' | 'none'

/** Each block's drop starts this long after the one before it, in ms. */
const DROP_STEP_MS = 80
/** Long enough for the last block to land; then the page lets go of the intro. */
const DROP_DONE_MS = 2400

/**
 * The homepage as a ruled index: the work as a typeset list on hairlines, with
 * the row in focus showing its cover in one fixed cell beside the list. Every
 * block sits on the site's one grid (.swiss-grid: 12 columns, 4 on phones,
 * 8px baseline) and carries no section labels.
 *
 * With `intro="led"` the first visit opens on the LED intro: the name lights up
 * across the whole screen and flies into place, then the rows drop onto their
 * hairlines one by one. Later visits in the same tab start on the page.
 */
export function RuledIndex({ items, intro = 'none' }: { items: WorkItem[]; intro?: IndexIntro }) {
  const [active, setActive] = useState(0)
  const [phase, setPhase] = useState<'pre' | 'done'>(intro === 'led' ? 'pre' : 'done')
  const [delay, setDelay] = useState(LED_FLY_AT)

  // A skipped intro hands over at once, so the drop starts now.
  const landed = useCallback((skipped: boolean) => {
    if (skipped) setDelay(0)
    setPhase('done')
  }, [])

  // Once everything has landed, drop the page's hold so nothing replays on a later mount.
  useEffect(() => {
    if (intro !== 'led' || phase !== 'done') return
    const timer = window.setTimeout(() => delete document.documentElement.dataset.ledIntro, delay + DROP_DONE_MS)
    return () => clearTimeout(timer)
  }, [intro, phase, delay])

  // Blocks drop in reading order; the counter numbers them as they render.
  let order = 0
  const drop = () => ({ '--i': order++ }) as React.CSSProperties

  const all = items.map((item) => item.meta.year)
  const years = `${Math.min(...all)}–${Math.max(...all)}`

  return (
    <div
      className="ri"
      data-intro={phase}
      data-reveal={intro === 'led' ? 'drop' : undefined}
      style={{ '--reveal-delay': `${delay}ms`, '--drop-step': `${DROP_STEP_MS}ms` } as React.CSSProperties}
    >
      <header className="ri-strip swiss-grid t-label items-center" data-drop style={drop()}>
        <p className="col-span-2 md:col-span-6">
          New York<span className="md:hidden"> · {years}</span>
        </p>
        <p className="hidden md:col-span-4 md:block">{years}</p>
        <span className="col-span-2 flex justify-end">
          <WindowShade inline />
        </span>
      </header>

      <div className="flex flex-col gap-[calc(var(--baseline)*14)] pt-[calc(var(--baseline)*6)] pb-[calc(var(--baseline)*16)]">
        <section className="swiss-grid gap-y-4">
          <div className="ri-wordmark col-span-full">
            <NameHero name={site.name} face="led" motion={wordmarkMotion} intro="auto" loadDelay={150} />
          </div>
          <div className="ri-row col-span-full grid grid-cols-subgrid gap-y-2" data-drop style={drop()}>
            <p className="col-span-full md:col-span-6">{site.headline}</p>
            <p className="col-span-full text-ink-muted md:col-span-5 md:col-start-8">{site.bio}</p>
          </div>
        </section>

        <section className="swiss-grid gap-y-6" aria-label="Work">
          <div className="ri-cover-cell col-span-full md:col-span-5 md:col-start-8 md:row-start-1" data-drop style={drop()}>
            <div className="ri-cover aspect-[3/2] md:aspect-[4/5]">
              <WorkCover item={items[active]} index={active} sizes="(min-width: 768px) 40vw, 100vw" />
            </div>
          </div>
          <ul className="col-span-full md:col-span-7 md:col-start-1 md:row-start-1">
            {items.map((item, i) => (
              <li key={item.meta.slug} data-drop style={drop()}>
                <Link
                  href={`/work/${item.meta.slug}`}
                  transitionTypes={['nav-forward']}
                  data-active={i === active || undefined}
                  onPointerEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  className="ri-link ri-row grid grid-cols-[1fr_auto] items-baseline gap-x-(--gutter) gap-y-1 md:grid-cols-[minmax(0,4fr)_minmax(0,2fr)_auto]"
                >
                  <span className="ri-title">{item.meta.title}</span>
                  <span className="t-label hidden text-ink-faint md:block">{item.meta.subtitle}</span>
                  <span className="t-label text-right">{item.meta.year}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="swiss-grid" aria-label="Experience">
          <ul className="t-label col-span-full grid grid-cols-subgrid">
            {roles.map((role) => (
              <li key={role.role} className="ri-row col-span-full grid grid-cols-subgrid" data-drop style={drop()}>
                <span className="col-span-2 md:col-span-4">{role.org}</span>
                <span className="col-span-2 md:col-span-6">{role.role}</span>
                <span className="col-span-full text-ink-faint md:col-span-2 md:text-right">{role.when}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="swiss-grid" aria-label="Contact">
          <a
            href={`mailto:${site.email}`}
            className="ri-row ri-link col-span-full flex items-baseline justify-between gap-6"
            data-drop
            style={drop()}
          >
            <span className="ri-title break-all">{site.email}</span>
            <span className="t-label">↗</span>
          </a>
          <ul className="t-label col-span-full mt-4 flex flex-wrap gap-x-5 gap-y-1" data-drop style={drop()}>
            {site.links.map((link) => (
              <li key={link.label}>
                <a
                  href={link.kind === 'asset' ? asset(link.href) : link.href}
                  {...(link.kind === 'external' ? { target: '_blank', rel: 'noreferrer' } : {})}
                  className="transition-colors hover:text-accent"
                >
                  {link.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {phase === 'pre' ? <LedPreroll target=".ri-wordmark .flap-wordmark" once={LED_INTRO_KEY} onDone={landed} /> : null}
      <GridOverlay />
    </div>
  )
}
