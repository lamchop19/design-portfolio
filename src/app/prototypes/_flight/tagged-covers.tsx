import Link from 'next/link'

import { Barcode } from '@/components/brand/barcode'
import { WorkCover } from '@/components/home/work-cover'
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
 * The work as a grid of covers, image first. Each wears a luggage tag hung
 * over its top corner (the flight code, its route and a barcode) that swings
 * when the card is pointed at.
 */
export function TaggedCovers({ items }: { items: WorkItem[] }) {
  return (
    <ul className="swiss-grid gap-y-14 md:gap-y-16">
      {items.map((item, i) => {
        const { meta } = item
        const result = results[meta.slug]
        return (
          <li key={meta.slug} className="col-span-full md:col-span-6">
            <Link
              href={`/work/${meta.slug}`}
              transitionTypes={['nav-forward']}
              aria-label={`${meta.title}, ${meta.subtitle}, ${meta.year}`}
              className="tag-card"
            >
              {/* The sky finishes turning blue at the foot of the first row. */}
              <div className="tag-card-cover" data-fade-end={i === 0 || undefined}>
                <WorkCover item={item} index={i} sizes="(min-width: 768px) 46vw, 100vw" />
              </div>
              <LuggageTag meta={meta} />
              <div className="mt-4 flex items-start justify-between gap-6">
                <div>
                  <p className="text-[22px] leading-7 font-medium tracking-[-0.02em] md:text-[28px] md:leading-8">
                    {meta.title}
                  </p>
                  <p className="t-label mt-1 text-ink-faint">
                    {meta.subtitle} · {meta.year}
                  </p>
                </div>
                {result ? (
                  <p
                    className={`t-label shrink-0 px-2 py-1 ${result.placeholder ? 'flight-ph' : 'bg-ink text-surface'}`}
                    title={result.placeholder ? 'Placeholder: real metric needed' : undefined}
                  >
                    {result.value}
                  </p>
                ) : null}
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

/** A paper luggage tag on a strap: the route stripes, flight code, destination and a barcode. Decorative. */
function LuggageTag({ meta }: { meta: WorkMeta }) {
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
