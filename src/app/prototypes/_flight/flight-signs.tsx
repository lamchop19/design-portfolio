'use client'

import { Fragment, useCallback, useEffect, useRef } from 'react'

import { NameHero } from '@/components/brand/name-hero'
import { GridOverlay } from '@/components/layout/grid-overlay'
import { scrollToY } from '@/components/layout/smooth-scroll'
import { FlapText } from '@/components/split-flap/split-flap'
import type { WorkItem } from '@/lib/work-items'
import { site } from '@/../content/site'

import { PrototypeControls } from './controls'
import { ArrivalLeg, CruiseLeg, LayoverLeg } from './leg-content'
import { legClass, legs, type LegId } from './legs'
import { motionFor, useSettings } from './settings'
import { SignStrip } from './sign-nav'
import { useSoftSky } from './soft-sky'
import { routes, TaggedCovers, type Route } from './tagged-covers'
import { useDocumentTracker, useFlightState } from './use-flight'

import './signs.css'

const DOCK_MS = 900
/** If the wordmark never reports landing, dock anyway. */
const DOCK_FALLBACK_MS = 9000
const SKIP_EVENTS = ['wheel', 'touchmove', 'keydown', 'pointerdown', 'scroll'] as const
/** Room left above a jump anchor for the strip. */
const ANCHOR_OFFSET = 88

/**
 * The Flight with signage. The page opens blank but for the wordmark, which
 * flips in at full width; once it lands it shrinks to three quarters and
 * docks at the top, and the rest of the page arrives around it. The top strip
 * is a row of wayfinding plates, and the work follows straight under the
 * name as a grid of tagged covers. One soft, grainy sky runs behind the whole
 * trip. No progress rail.
 */
export function FlightSigns({ items }: { items: WorkItem[] }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const dockRef = useRef<HTMLDivElement>(null)
  const skyRef = useRef<HTMLDivElement>(null)
  const { active, setStops, report } = useFlightState()
  const settings = useSettings()
  const motion = motionFor(settings.flip, settings.speed)
  // The gate is short here, so a leg takes over a little higher than halfway.
  useDocumentTracker(rootRef, true, report, setStops, 0.3)
  useSoftSky(rootRef, skyRef)

  // A leg can name a `data-anchor` to land on instead of its top (the work's header sits up in the gate).
  const jump = useCallback((i: number) => {
    const root = rootRef.current
    if (!root) return
    if (i === 0) return scrollToY(0)
    const anchor = root.querySelector(`[data-anchor="${legs[i].id}"]`)
    const target = anchor ?? root.querySelector(`[data-leg="${legs[i].id}"]`)
    if (target) scrollToY(target.getBoundingClientRect().top + window.scrollY - (anchor ? ANCHOR_OFFSET : 0))
  }, [])

  // The intro's phase lives on the root as `data-intro` and is changed
  // directly, so docking can measure before and after in one frame. React
  // renders it once and, since the prop never changes, leaves it alone.
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

  // Start a stage: skipped outright for reduced motion or a page that opens
  // scrolled down; any wheel, key or touch docks early.
  useEffect(() => {
    const root = rootRef.current!
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || (settings.replay === 0 && window.scrollY > 0)) {
      root.dataset.intro = 'done'
      return
    }
    if (settings.replay > 0) {
      scrollToY(0, { immediate: true })
      root.dataset.intro = 'stage'
    }
    const fallback = window.setTimeout(dock, DOCK_FALLBACK_MS)
    // The replay's own jump to the top fires a scroll; listen from the next frame.
    const frame = requestAnimationFrame(() => SKIP_EVENTS.forEach((type) => window.addEventListener(type, dock, { passive: true })))
    return () => {
      clearTimeout(fallback)
      cancelAnimationFrame(frame)
      SKIP_EVENTS.forEach((type) => window.removeEventListener(type, dock))
    }
  }, [settings.replay, dock])

  const content: Record<Exclude<LegId, 'gate' | 'departures'>, React.ReactNode> = {
    cruise: <CruiseLeg bins={false} drift={false} />,
    layover: <LayoverLeg />,
    arrival: <ArrivalLeg onReturn={() => jump(0)} />,
  }

  return (
    <div ref={rootRef} className="flight flight-v flight-signs" data-intro="stage">
      <div ref={skyRef} className="signs-sky" aria-hidden="true" />
      <SignStrip active={active} onJump={jump} />

      <section data-leg="gate" className={legClass('gate')}>
        <div className="swiss-grid pt-[88px] pb-8 md:pt-[104px]">
          <div ref={dockRef} className="signs-dock col-span-full">
            <NameHero
              key={`${settings.flip}-${settings.speed}-${settings.replay}`}
              name={site.name}
              motion={motion}
              intro={settings.replay ? 'full' : 'auto'}
              onSettle={dock}
            />
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

      <PrototypeControls chrome={false} replayLabel="Replay intro" onReplay={() => undefined} />
      <GridOverlay />
    </div>
  )
}

/** The headline and the routes now boarding, on one line under the docked name. */
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

/** The work's header, set in the gate under the strap so it reads in the gate's ink as the sky turns blue below. */
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

/** Room between two legs for the sky to turn from one colour to the next (see `useSoftSky`). */
function Blend() {
  return <div aria-hidden="true" className="flight-blend" data-blend />
}
