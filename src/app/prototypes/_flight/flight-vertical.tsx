'use client'

import { Fragment, useCallback, useRef } from 'react'

import { GridOverlay } from '@/components/layout/grid-overlay'
import { scrollToY } from '@/components/layout/smooth-scroll'
import type { WorkItem } from '@/lib/work-items'

import { FlightRail, FlightStrip } from './chrome'
import { PrototypeControls } from './controls'
import { ArrivalLeg, CruiseLeg, DeparturesHeader, GateLeg, LayoverLeg, PassList } from './leg-content'
import { motionFor, useSettings } from './settings'
import { legClass, legs, sky, type LegId } from './legs'
import { useDocumentTracker, useFlightState, useMediaQuery, usePinnedTrack } from './use-flight'

/**
 * The Flight, scrolled downwards. Each leg is a full-height section in its own
 * solid sky, joined to the next by a band of gradient; the rail runs down the
 * right margin. Departures pins while its passes slide past sideways. Labels
 * that only dress the theme (`data-detail`) are left out.
 */
export function FlightVertical({ items }: { items: WorkItem[] }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const { active, stops, setStops, report, readoutRef } = useFlightState()
  const settings = useSettings()
  const motion = motionFor(settings.flip, settings.speed)
  const gate = (
    <GateLeg
      dir="v"
      motion={motion}
      motionKey={`${settings.flip}-${settings.speed}`}
      replay={settings.replay}
    />
  )
  useDocumentTracker(rootRef, true, report, setStops)

  const jump = useCallback((i: number) => {
    const section = rootRef.current?.querySelector(`[data-leg="${legs[i].id}"]`)
    if (section) scrollToY(section.getBoundingClientRect().top + window.scrollY)
  }, [])

  const content: Record<Exclude<LegId, 'departures'>, React.ReactNode> = {
    gate,
    cruise: <CruiseLeg />,
    layover: <LayoverLeg />,
    arrival: <ArrivalLeg onReturn={() => jump(0)} />,
  }

  return (
    <div ref={rootRef} className="flight flight-v" data-ui={settings.ui}>
      <FlightStrip active={active} onJump={jump} ui={settings.ui} />

      {legs.map((leg, i) => (
        <Fragment key={leg.id}>
          {i > 0 ? <Blend from={legs[i - 1].id} to={leg.id} /> : null}
          {leg.id === 'departures' ? (
            <PinnedDepartures items={items} />
          ) : (
            <section data-leg={leg.id} data-snap className={`${legClass(leg.id)} min-h-svh`} style={{ background: sky(leg.id) }}>
              {content[leg.id]}
            </section>
          )}
        </Fragment>
      ))}

      <FlightRail
        orientation="v"
        active={active}
        stops={stops}
        onJump={jump}
        onFly={(p) => scrollToY(p * (document.documentElement.scrollHeight - window.innerHeight), { immediate: true })}
        onLand={jump}
        readoutRef={readoutRef}
        ui={settings.ui}
      />
      <PrototypeControls onReplay={() => jump(0)} />
      <GridOverlay />
    </div>
  )
}

/** Work: the section holds still while scrolling down slides the passes across, like walking a jet bridge. */
function PinnedDepartures({ items }: { items: WorkItem[] }) {
  const outerRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLUListElement>(null)
  const wide = useMediaQuery('(min-width: 768px)')
  usePinnedTrack(outerRef, trackRef, wide)

  return (
    <section
      ref={outerRef}
      data-leg="departures"
      data-snap
      className={`${legClass('departures')} min-h-svh`}
      style={{ background: sky('departures') }}
    >
      <div className="flex min-h-svh flex-col justify-center gap-10 pt-24 pb-16 md:sticky md:top-0 md:h-svh md:overflow-hidden">
        <div className="swiss-grid">
          <div className="col-span-full md:col-span-6">
            <DeparturesHeader items={items} />
          </div>
          <p
            data-detail
            className="t-label col-span-full mt-4 self-end text-ink-faint md:col-span-3 md:col-start-10 md:mt-0 md:text-right">
            Keep scrolling, the passes slide by →
          </p>
        </div>
        {/* Clipped short of the rail, so the passes slide out of view before reaching it. */}
        <div className="overflow-hidden md:mr-[calc(var(--page-margin)+var(--rail-space))]">
          <PassList ref={trackRef} items={items} className="pr-[calc(var(--page-margin)+var(--rail-space))] pl-(--page-margin) md:w-max md:pr-0 md:will-change-transform" />
        </div>
      </div>
    </section>
  )
}

/** A band of sky between two legs, fading one colour into the next. */
function Blend({ from, to }: { from: LegId; to: LegId }) {
  return (
    <div
      aria-hidden="true"
      className="flight-blend"
      style={{ background: `linear-gradient(${sky(from)}, ${sky(to)})` }}
    />
  )
}
