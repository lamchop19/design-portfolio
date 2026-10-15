'use client'

import { Fragment, useCallback, useRef } from 'react'

import { NameHero } from '@/components/brand/name-hero'
import { GridOverlay } from '@/components/layout/grid-overlay'
import { HangMargin } from '@/components/layout/hang-margin'
import { scrollToY } from '@/components/layout/smooth-scroll'
import { FlapText } from '@/components/split-flap/split-flap'
import { FLAP_LAND_MS, FLAP_STEP_MS, flapEases } from '@/lib/flap-motion'
import type { WorkItem } from '@/lib/work-items'
import { site } from '@/../content/site'

import { legClass, legs, type LegId } from './legs'
import { SignStrip } from './sign-nav'
import { useSoftSky } from './soft-sky'
import { routes, TaggedCovers, type Route } from './tagged-covers'
import { useActiveLeg } from './use-landing'
import { BaggageHall } from './baggage-hall'
import { DotField } from './dot-field'
import { AboutSection, ContactSection, ExperienceSection } from './sections'

import '@/app/prototypes/_flight/flight.css'
import '@/app/prototypes/_flight/signs.css'
import '@/app/prototypes/_baggage/baggage.css'
import './baggage-hall.css'
import './hero-intro.css'

const ANCHOR_OFFSET = 88

/**
 * How the hero arrives on load. Each runs the parts in a different order;
 * hero-intro.css has the choreography, and these are the parts JS starts.
 */
export type HeroIntro = 'cascade' | 'lights' | 'belt' | 'shade' | 'none'

/** When the wordmark starts resolving and the route pills flap in, in ms, per intro. */
const INTRO_TIMING: Record<HeroIntro, { wordmark: number; pills: number }> = {
  cascade: { wordmark: 250, pills: 1550 },
  lights: { wordmark: 0, pills: 2150 },
  belt: { wordmark: 950, pills: 2250 },
  shade: { wordmark: 750, pills: 1950 },
  none: { wordmark: 0, pills: 1500 },
}

const wordmarkMotion = {
  step: FLAP_STEP_MS * 2,
  land: FLAP_LAND_MS * 2,
  ease: flapEases.expo.fn,
}

/**
 * The wordmark and baggage hall lead into the selected work and Flight sections.
 */
export function LandingFlight({ items, intro = 'lights' }: { items: WorkItem[]; intro?: HeroIntro }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const skyRef = useRef<HTMLDivElement>(null)
  const active = useActiveLeg(rootRef, 0.3)
  useSoftSky(rootRef, skyRef)

  const jump = useCallback((i: number) => {
    const root = rootRef.current
    if (!root) return
    if (i === 0) return scrollToY(0)
    const anchor = root.querySelector(`[data-anchor="${legs[i].id}"]`)
    const target = anchor ?? root.querySelector(`[data-leg="${legs[i].id}"]`)
    if (target) scrollToY(target.getBoundingClientRect().top + window.scrollY - (anchor ? ANCHOR_OFFSET : 0))
  }, [])

  const content: Record<Exclude<LegId, 'gate' | 'departures'>, React.ReactNode> = {
    cruise: <AboutSection />,
    layover: <ExperienceSection />,
    arrival: <ContactSection onReturn={() => jump(0)} />,
  }

  return (
    <div ref={rootRef} id="top" className="flight flight-v flight-signs landing-hall" data-intro="done" data-seq={intro}>
      <div ref={skyRef} className="signs-sky" aria-hidden="true" />
      <DotField leg={legs[active].id} />
      <SignStrip active={active} onJump={jump} />

      <section data-leg="gate" className={`${legClass('gate')} landing-gate`}>
        {/* Above the fold: the wordmark and the baggage hall fill the first screen between them. */}
        <div className="landing-fold">
          <div className="swiss-grid landing-heading">
            <HangMargin className="landing-margin">
              <p>New York</p>
              <p>{span(items)}</p>
            </HangMargin>
            <div className="landing-wordmark col-span-full md:col-span-9">
              <NameHero
                name={site.name}
                face="led"
                motion={wordmarkMotion}
                intro="auto"
                loadDelay={INTRO_TIMING[intro].wordmark}
              />
            </div>
            <Strap pillsAt={INTRO_TIMING[intro].pills} />
          </div>
          <BaggageHall items={items} />
          {intro === 'shade' ? <div className="landing-shade" aria-hidden="true" /> : null}
        </div>
        <div className="swiss-grid landing-departures"><DeparturesHeader items={items} /></div>
      </section>

      <div className="signs-after">
        {legs.slice(1).map((leg, i) => (
          <Fragment key={leg.id}>
            {i > 0 ? <Blend /> : null}
            {leg.id === 'departures' ? (
              <section data-leg="departures" className={`${legClass('departures')} pb-28`}>
                <TaggedCovers items={items} />
              </section>
            ) : (
              <section data-leg={leg.id} data-snap className={`${legClass(leg.id)} min-h-svh`}>
                {content[leg.id as keyof typeof content]}
              </section>
            )}
          </Fragment>
        ))}
      </div>

      <GridOverlay />
    </div>
  )
}

function Strap({ pillsAt }: { pillsAt: number }) {
  return (
    <div className="signs-strap rule-draw col-span-full mt-5 md:col-span-9 md:col-start-4 flex flex-col gap-3 pt-4 md:mt-6 md:flex-row md:items-center md:justify-between">
      <p className="text-[20px] leading-7 font-medium tracking-[-0.02em] md:text-[24px]">{site.headline}</p>
      <p className="t-label flex flex-wrap items-center gap-1.5">
        {(Object.keys(routes) as Route[]).map((route, i) => (
          <span
            key={route}
            className="route-pill"
            style={{ background: routes[route].fill, color: routes[route].ink, '--i': i } as React.CSSProperties}
          >
            <FlapText text={route} intro="quick" delay={pillsAt + i * 90} />
          </span>
        ))}
      </p>
    </div>
  )
}

/** The years the work spans: "2024—2025". */
function span(items: WorkItem[]) {
  const years = items.map((item) => item.meta.year)
  return `${Math.min(...years)}—${Math.max(...years)}`
}

function DeparturesHeader({ items }: { items: WorkItem[] }) {
  return (
    <div data-anchor="departures" className="signs-after t-label col-span-full grid grid-cols-subgrid items-baseline gap-y-2">
      <HangMargin>{String(items.length).padStart(2, '0')} flights</HangMargin>
      <h2 className="col-span-full md:col-span-9">Selected flights</h2>
    </div>
  )
}

function Blend() {
  return <div aria-hidden="true" className="flight-blend" data-blend />
}
