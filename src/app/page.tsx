import { ViewTransition } from 'react'

import { NameHero } from '@/components/brand/name-hero'
import { Colophon } from '@/components/home/colophon'
import { MetaStrip } from '@/components/home/meta-strip'
import { GridOverlay } from '@/components/layout/grid-overlay'
import { WorkSection } from '@/components/home/work-section'
import { FlapText } from '@/components/split-flap/split-flap'
import { withCovers } from '@/lib/work-items'
import { site } from '@/../content/site'
import { work } from '@/../content/work'

const destinations = ['Brand', 'Social', 'Graphic design']

/**
 * Layout A, the index: a specimen-sheet first screen (meta strip, headline,
 * the wordmark across all twelve columns, then an info row), followed by a
 * numbered table of work with a pinned preview.
 */
export default function HomePage() {
  const items = withCovers(work)

  return (
    <ViewTransition
      enter={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
      exit={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
      default="none"
    >
      <div id="top">
        {/* data-snap marks the section starts that SmoothScroll settles onto. */}
        <div className="flex min-h-svh flex-col" data-snap>
          <MetaStrip count={items.length} />

          <header className="swiss-grid flex-1 content-between gap-y-16 pt-6 pb-6 md:pt-8">
            <ul className="t-label col-span-2 md:col-span-3">
              <li className="text-ink-faint">Destinations</li>
              {destinations.map((d, i) => (
                <li key={d}>
                  <FlapText text={d} intro="quick" delay={{ first: 1500 + i * 90, repeat: 450 + i * 90 }} />
                </li>
              ))}
            </ul>
            <p className="col-span-full text-[clamp(2rem,4.4vw,4rem)] leading-[1.05] font-medium tracking-[-0.035em] text-balance md:col-span-6 md:col-start-7">
              {site.headline}
            </p>
            <NameHero name={site.name} className="col-span-full" />
          </header>

          <section
            aria-labelledby="info-heading"
            className="swiss-grid rule-draw gap-y-4 pt-4 pb-8"
            style={{ '--i': 1 } as React.CSSProperties}
          >
            <h2 id="info-heading" className="t-label col-span-full text-ink-faint md:col-span-3">
              <FlapText text="01 — Passenger" intro="quick" delay={{ first: 1800, repeat: 700 }} />
            </h2>
            <p className="col-span-full max-w-[40ch] text-lg leading-7 md:col-span-6 md:text-xl md:leading-8">
              {site.bio}
            </p>
          </section>
        </div>

        <section id="work" aria-labelledby="work-heading" className="swiss-grid gap-y-8 pt-24 pb-32" data-snap>
          <WorkSection items={items} />
        </section>

        <div className="swiss-grid">
          <Colophon number="03" className="col-span-full" />
        </div>
      </div>
      <GridOverlay />
    </ViewTransition>
  )
}
