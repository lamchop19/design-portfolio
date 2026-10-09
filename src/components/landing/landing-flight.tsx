'use client'

import { Fragment, useCallback, useEffect, useRef } from 'react'

import { NameHero } from '@/components/brand/name-hero'
import { GridOverlay } from '@/components/layout/grid-overlay'
import { scrollToY } from '@/components/layout/smooth-scroll'
import { FlapText } from '@/components/split-flap/split-flap'
import { ArrivalLeg, CruiseLeg, LayoverLeg } from '@/app/prototypes/_flight/leg-content'
import { FLAP_LAND_MS, FLAP_STEP_MS, flapEases } from '@/lib/flap-motion'
import type { WorkItem } from '@/lib/work-items'
import { site } from '@/../content/site'

import { legClass, legs, type LegId } from './legs'
import { SignStrip } from './sign-nav'
import { useSoftSky } from './soft-sky'
import { routes, TaggedCovers, type Route } from './tagged-covers'
import { useActiveLeg } from './use-landing'

import '@/app/prototypes/_flight/flight.css'
import '@/app/prototypes/_flight/signs.css'

const DOCK_MS = 900
const DOCK_FALLBACK_MS = 9000
const SKIP_EVENTS = ['wheel', 'touchmove', 'keydown', 'pointerdown', 'scroll'] as const
const ANCHOR_OFFSET = 88

const wordmarkMotion = {
  step: FLAP_STEP_MS * 2,
  land: FLAP_LAND_MS * 2,
  ease: flapEases.expo.fn,
}

/**
 * The production landing page: a blank-stage wordmark intro that docks into
 * modular wayfinding, followed by immediate tagged-cover work and the Flight
 * route sections.
 */
export function LandingFlight({ items }: { items: WorkItem[] }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const dockRef = useRef<HTMLDivElement>(null)
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

  const dock = useCallback(() => {
    const root = rootRef.current
    const el = dockRef.current
    if (!root || !el || root.dataset.intro !== 'stage') return
    const first = el.getBoundingClientRect()
    root.dataset.intro = 'done'
    const last = el.getBoundingClientRect()
    if (!last.width) return
    el.animate(
      [
        {
          transform: `translate(${first.left - last.left}px, ${first.top - last.top}px) scale(${first.width / last.width})`,
        },
        { transform: 'none' },
      ],
      { duration: DOCK_MS, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    )
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || window.scrollY > 0) {
      root.dataset.intro = 'done'
      return
    }
    const fallback = window.setTimeout(dock, DOCK_FALLBACK_MS)
    const frame = requestAnimationFrame(() => SKIP_EVENTS.forEach((type) => window.addEventListener(type, dock, { passive: true })))
    return () => {
      clearTimeout(fallback)
      cancelAnimationFrame(frame)
      SKIP_EVENTS.forEach((type) => window.removeEventListener(type, dock))
    }
  }, [dock])

  const content: Record<Exclude<LegId, 'gate' | 'departures'>, React.ReactNode> = {
    cruise: <CruiseLeg bins={false} drift={false} />,
    layover: <LayoverLeg />,
    arrival: <ArrivalLeg onReturn={() => jump(0)} />,
  }

  return (
    <div ref={rootRef} id="top" className="flight flight-v flight-signs" data-intro="stage">
      <div ref={skyRef} className="signs-sky" aria-hidden="true" />
      <SignStrip active={active} onJump={jump} />

      <section data-leg="gate" className={legClass('gate')}>
        <div className="swiss-grid pt-[88px] pb-8 md:pt-[104px]">
          <div ref={dockRef} className="signs-dock col-span-full">
            <NameHero name={site.name} motion={wordmarkMotion} intro="auto" onSettle={dock} />
          </div>
          <Strap />
          <DeparturesHeader items={items} />
        </div>
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

function Strap() {
  return (
    <div className="signs-strap rule-draw col-span-full mt-5 flex flex-col gap-3 pt-4 md:mt-6 md:flex-row md:items-center md:justify-between">
      <p className="text-[20px] leading-7 font-medium tracking-[-0.02em] md:text-[24px]">{site.headline}</p>
      <p className="t-label flex flex-wrap items-center gap-1.5">
        <span className="mr-1.5 text-ink-faint">Now boarding</span>
        {(Object.keys(routes) as Route[]).map((route, i) => (
          <span key={route} className="route-pill" style={{ background: routes[route].fill, color: routes[route].ink }}>
            <FlapText text={route} intro="quick" delay={{ first: 1500 + i * 90, repeat: 450 + i * 90 }} />
          </span>
        ))}
      </p>
    </div>
  )
}

function DeparturesHeader({ items }: { items: WorkItem[] }) {
  const years = items.map((item) => item.meta.year)
  return (
    <div data-anchor="departures" className="signs-after t-label col-span-full mt-14 grid grid-cols-subgrid items-baseline gap-y-2 md:mt-20">
      <p className="col-span-2 text-ink-faint md:col-span-3">02 — Departures</p>
      <h2 className="col-span-2 md:col-span-6">Selected flights</h2>
      <p className="col-span-full text-ink-faint md:col-span-3 md:text-right">
        {String(items.length).padStart(2, '0')} flights · {Math.min(...years)}—{Math.max(...years)}
      </p>
    </div>
  )
}

function Blend() {
  return <div aria-hidden="true" className="flight-blend" data-blend />
}
