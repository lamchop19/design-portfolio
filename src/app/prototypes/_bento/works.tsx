'use client'

import Link from 'next/link'
import { useState } from 'react'

import { WorkCover } from '@/components/home/work-cover'
import { results } from '@/components/landing/legs'
import { LuggageTag, routes, routesOf, type Route } from '@/components/landing/tagged-covers'
import type { WorkItem } from '@/lib/work-items'

import { toneFor } from '../_tone/palette'

/** A project as a tagged cover: image, luggage tag, title and its one headline result. */
export function WorkCard({
  item,
  index,
  sizes,
  fill = false,
  className,
}: {
  item: WorkItem
  index: number
  sizes: string
  /** Fill the tile it sits in, instead of keeping the cover at 4:3. */
  fill?: boolean
  className?: string
}) {
  const { meta } = item
  const result = results[meta.slug]
  return (
    <Link
      href={`/work/${meta.slug}`}
      transitionTypes={['nav-forward']}
      aria-label={`${meta.title}, ${meta.subtitle}, ${meta.year}`}
      className={['tag-card bento-work', className].filter(Boolean).join(' ')}
      data-fill={fill || undefined}
    >
      <div className="tag-card-cover">
        <WorkCover item={item} index={index} sizes={sizes} />
      </div>
      <LuggageTag meta={meta} />
      <div className="bento-work-caption">
        <div className="min-w-0">
          <p className="truncate text-[20px] leading-7 font-medium tracking-[-0.02em] md:text-[24px] md:leading-8">{meta.title}</p>
          <p className="t-label mt-1 truncate text-ink-faint">
            {meta.subtitle} · {meta.year}
          </p>
        </div>
        {result ? <p className="t-label shrink-0 bg-ink px-2 py-1 text-surface">{result}</p> : null}
      </div>
    </Link>
  )
}

/**
 * A project as a gate in the work row. It carries its project hue (the
 * tone-on-tone palette) and lights up in it when pointed at or focused, while
 * the other gates in the row dim (see .gate-row in bento.css).
 */
export function GateCard({ item, index, sizes }: { item: WorkItem; index: number; sizes: string }) {
  const { meta } = item
  const tone = toneFor(meta.slug, index)
  const result = results[meta.slug]
  return (
    <Link
      href={`/work/${meta.slug}`}
      transitionTypes={['nav-forward']}
      aria-label={`${meta.title}, ${meta.subtitle}, ${meta.year}`}
      className="tag-card gate-card"
      style={{ '--tone-hero': tone.hero, '--tone-ink': tone.heroInk } as React.CSSProperties}
    >
      <div className="tag-card-cover gate-card-cover">
        <WorkCover item={item} index={index} sizes={sizes} />
      </div>
      <LuggageTag meta={meta} />
      <div className="gate-card-caption">
        <p className="truncate text-[20px] leading-7 font-medium tracking-[-0.02em]">{meta.title}</p>
        <p className="t-label mt-1 flex items-center justify-between gap-3">
          <span className="gate-card-meta truncate">{meta.subtitle} · {meta.year}</span>
          {result ? <span className="gate-card-result shrink-0">{result}</span> : null}
        </p>
      </div>
    </Link>
  )
}

/** The Brand / Social / Content pills as toggles. None on means everything shows. */
export function RouteFilter({ value, onChange }: { value: Route | null; onChange: (route: Route | null) => void }) {
  return (
    <div className="t-label flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by route">
      {(Object.keys(routes) as Route[]).map((route) => {
        const on = value === route
        return (
          <button
            key={route}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? null : route)}
            className="route-pill route-toggle"
            style={{ '--pill-fill': routes[route].fill, '--pill-ink': routes[route].ink } as React.CSSProperties}
          >
            {route}
          </button>
        )
      })}
    </div>
  )
}

export function useRouteFilter(items: WorkItem[]) {
  const [route, setRoute] = useState<Route | null>(null)
  const shown = route ? items.filter((item) => routesOf(item.meta).includes(route)) : items
  return { route, setRoute, shown }
}

/**
 * The work column for the split layout: a header that sticks under the bar,
 * with the count, years and route filter, over a list of tagged covers.
 */
export function WorksColumn({ items }: { items: WorkItem[] }) {
  const { route, setRoute, shown } = useRouteFilter(items)
  const years = items.map((item) => item.meta.year)

  return (
    <section aria-labelledby="bento-works" className="bento-works">
      <header className="bento-works-head">
        <div className="t-label flex items-baseline justify-between gap-4">
          <p>
            <span className="text-ink-faint">02 — </span>
            <span id="bento-works">Departures</span>
          </p>
          <p className="text-ink-faint">
            {String(items.length).padStart(2, '0')} flights · {Math.min(...years)}—{Math.max(...years)}
          </p>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[24px] leading-8 font-medium tracking-[-0.02em] md:text-[30px] md:leading-9">Selected flights</h2>
          <RouteFilter value={route} onChange={setRoute} />
        </div>
      </header>

      <ul className="bento-works-list" aria-live="polite">
        {shown.map((item) => {
          const index = items.indexOf(item)
          return (
            <li key={item.meta.slug}>
              <WorkCard item={item} index={index} sizes="(min-width: 1600px) 28vw, (min-width: 1024px) 55vw, 100vw" />
            </li>
          )
        })}
      </ul>
      {shown.length === 0 ? <p className="t-label py-16 text-ink-faint">No flights on this route yet.</p> : null}
    </section>
  )
}
