'use client'

import { Fragment, useCallback, useRef } from 'react'

import { GridOverlay } from '@/components/layout/grid-overlay'
import { scrollToY } from '@/components/layout/smooth-scroll'
import type { WorkItem } from '@/lib/work-items'

import { FlightRail, FlightStrip } from './chrome'
import { PrototypeControls } from './controls'
import { ArrivalLeg, CruiseLeg, DeparturesHeader, GateLeg, LayoverLeg, PassList } from './leg-content'
import { motionFor, useSettings } from './settings'
import { legClass, legs, sky, type Leg } from './legs'
import { useDocumentTracker, useFlightState, useMediaQuery, usePinnedTrack } from './use-flight'

/**
 * The Flight, flown sideways. From tablet up the page pins and ordinary
 * downward scrolling carries the whole route right to left, so the plane on
 * the rail and the page move together. Between legs the sky crossfades
 * (dawn to night) instead of cutting. Phones get the legs stacked.
 */
export function FlightHorizontal({ items }: { items: WorkItem[] }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const outerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const lefts = useRef<number[]>([])
  const { active, stops, setStops, report, readoutRef } = useFlightState()
  const settings = useSettings()
  const motion = motionFor(settings.flip, settings.speed)
  const gate = (
    <GateLeg
      dir="h"
      motion={motion}
      motionKey={`${settings.flip}-${settings.speed}`}
      replay={settings.replay}
    />
  )
  const wide = useMediaQuery('(min-width: 768px)')

  const metrics = usePinnedTrack(outerRef, trackRef, wide, {
    onMeasure: (max) => {
      const panels = [...trackRef.current!.querySelectorAll<HTMLElement>('[data-leg]')]
      lefts.current = panels.map((panel) => panel.offsetLeft)
      setStops(lefts.current.map((left) => (max ? Math.min(1, left / max) : 0)))
    },
    onMove: (progress, x) => {
      const half = metrics.current.width / 2
      let leg = 0
      lefts.current.forEach((left, i) => {
        if (left <= x + half) leg = i
      })
      report(progress, leg)
    },
  })
  useDocumentTracker(rootRef, !wide, report, setStops)

  const jump = useCallback(
    (i: number) => {
      if (wide) {
        const top = outerRef.current!.getBoundingClientRect().top + window.scrollY
        scrollToY(top + Math.min(metrics.current.max, lefts.current[i] ?? 0))
        return
      }
      const section = rootRef.current?.querySelector(`[data-leg="${legs[i].id}"]`)
      if (section) scrollToY(section.getBoundingClientRect().top + window.scrollY)
    },
    [wide, metrics],
  )

  /** The dragged rail plane's progress as a scroll position: through the pinned track when wide, down the page when stacked. */
  const fly = useCallback(
    (p: number) => {
      if (wide) {
        const top = outerRef.current!.getBoundingClientRect().top + window.scrollY
        scrollToY(top + p * metrics.current.max, { immediate: true })
        return
      }
      scrollToY(p * (document.documentElement.scrollHeight - window.innerHeight), { immediate: true })
    },
    [wide, metrics],
  )

  const content: Record<Leg['id'], React.ReactNode> = {
    gate,
    departures: (
      <div className="flex min-h-[inherit] flex-col justify-center gap-10 pt-24 pb-28 md:h-full md:flex-row md:items-center md:gap-20 md:px-(--page-margin)">
        <div className="px-(--page-margin) md:w-[26vw] md:flex-none md:px-0">
          <DeparturesHeader items={items} />
        </div>
        <PassList items={items} className="px-(--page-margin) md:px-0 md:pr-[8vw]" />
      </div>
    ),
    cruise: <CruiseLeg />,
    layover: <LayoverLeg />,
    arrival: <ArrivalLeg onReturn={() => jump(0)} />,
  }

  return (
    <div ref={rootRef} className="flight flight-h" data-ui={settings.ui}>
      <FlightStrip active={active} onJump={jump} ui={settings.ui} />

      <div ref={outerRef} className="relative">
        <div className="md:sticky md:top-0 md:h-svh md:overflow-hidden">
          <div ref={trackRef} className="flex flex-col md:h-full md:w-max md:flex-row md:will-change-transform">
            {legs.map((leg, i) => (
              <Fragment key={leg.id}>
                {i > 0 ? <Blend from={legs[i - 1]} to={leg} /> : null}
                <section
                  data-leg={leg.id}
                  className={`${legClass(leg.id)} relative min-h-svh md:h-full md:min-h-0 ${
                    leg.id === 'departures' ? 'md:w-max' : 'md:w-(--pane-w)'
                  }`}
                  style={{ background: sky(leg.id) }}
                >
                  {content[leg.id]}
                </section>
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      <FlightRail
        orientation="h"
        active={active}
        stops={stops}
        onJump={jump}
        onFly={fly}
        onLand={jump}
        readoutRef={readoutRef}
        ui={settings.ui}
      />
      <PrototypeControls onReplay={() => jump(0)} />
      <GridOverlay />
    </div>
  )
}

/** A stretch of open sky where one leg's colours fade into the next. Wide screens only. */
function Blend({ from, to }: { from: Leg; to: Leg }) {
  return (
    <div aria-hidden="true" className="relative hidden w-[30vw] flex-none md:block">
      <div className="absolute inset-0" style={{ background: sky(from.id) }} />
      <div
        className="absolute inset-0"
        style={{ background: sky(to.id), maskImage: 'linear-gradient(90deg, transparent, #000)' }}
      />
    </div>
  )
}
