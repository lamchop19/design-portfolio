import Link from 'next/link'

import { Barcode } from '@/components/brand/barcode'
import { WorkCover } from '@/components/home/work-cover'
import { HangMargin } from '@/components/layout/hang-margin'
import { FlapText } from '@/components/split-flap/split-flap'
import type { WorkMeta } from '@/lib/content'
import { flightCode, type WorkItem } from '@/lib/work-items'

import { results } from './legs'

/** The three routes, each with its sign colour and an ink that reads on it. */
export const routes = {
  Brand: { fill: 'var(--brand-blue)', ink: '#ffffff' },
  Social: { fill: 'var(--brand-pink)', ink: '#0a0f1f' },
  Content: { fill: 'var(--brand-green)', ink: '#0a0f1f' },
} as const

export type Route = keyof typeof routes

/** Which routes a project flies, from its discipline line and tags. Anything not brand or social is content. */
export function routesOf(meta: WorkMeta): Route[] {
  const words = [meta.subtitle, ...meta.tags].join(' ').toLowerCase()
  const found: Route[] = []
  if (words.includes('brand')) found.push('Brand')
  if (words.includes('social')) found.push('Social')
  return found.length ? found : ['Content']
}

/**
 * The work on the hanging margin: one project per row, its discipline, year
 * and result in the margin and the cover from column 4, alternately wide and
 * narrow. Each cover wears a luggage tag hung over its top corner (the flight
 * code, its route and a barcode) that swings when the card is pointed at.
 */
export function TaggedCovers({ items }: { items: WorkItem[] }) {
  return (
    <ul className="swiss-grid gap-y-14 md:gap-y-24">
      {items.map((item, i) => {
        const { meta } = item
        const result = results[meta.slug]
        return (
          <li key={meta.slug} className="col-span-full grid grid-cols-subgrid gap-y-3">
            <HangMargin>
              <p>{meta.subtitle}</p>
              <p>{meta.year}</p>
              {result ? <p className="self-start bg-ink px-2 py-1 text-surface md:mt-2">{result}</p> : null}
            </HangMargin>
            <Link
              href={`/work/${meta.slug}`}
              transitionTypes={['nav-forward']}
              aria-label={`${meta.title}, ${meta.subtitle}, ${meta.year}`}
              className={`tag-card col-span-full ${i % 2 ? 'md:col-span-6' : 'md:col-span-9'}`}
            >
              {/* The sky finishes turning blue at the foot of the first row. */}
              <div className="tag-card-cover" data-fade-end={i === 0 || undefined}>
                <WorkCover item={item} index={i} sizes="(min-width: 768px) 72vw, 100vw" />
              </div>
              <LuggageTag meta={meta} />
              <p className="t-dot mt-4 text-[clamp(28px,3vw,40px)] leading-[1.1]">
                {meta.title}
              </p>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

/** A paper luggage tag on a strap: the route stripes, flight code, destination and a barcode. Decorative. */
export function LuggageTag({ meta }: { meta: WorkMeta }) {
  const flight = flightCode(meta)
  const flown = routesOf(meta)
  return (
    <span className="luggage-tag" aria-hidden="true">
      <svg className="luggage-strap" viewBox="0 0 24 46">
        <path d="M12 1C5 14 6 38 12 45C18 38 19 14 12 1Z" />
      </svg>
      <span className="luggage-tag-body leg-paper">
        <span className="luggage-tag-routes">
          {flown.map((route) => (
            <span key={route} style={{ background: routes[route].fill }} />
          ))}
        </span>
        <span className="t-label text-ink-faint">Flight</span>
        <FlapText text={flight} className="luggage-tag-code" trigger="visible" intro="quick" />
        <span className="t-label">NYC → {flown[0]}</span>
        <Barcode value={`${flight}${meta.slug}`} className="luggage-tag-barcode" />
      </span>
    </span>
  )
}
