'use client'

import { LiveClock } from '@/components/brand/live-clock'
import { WindowShade } from '@/components/layout/window-shade'
import { FlapText } from '@/components/split-flap/split-flap'

import { legClass, legs } from './legs'
import type { ChromeDensity } from './settings'

function NavLinks({ onJump, work = true }: { onJump: (leg: number) => void; work?: boolean }) {
  return (
    <>
      {work ? (
        <button type="button" onClick={() => onJump(1)} className="transition-colors hover:text-accent">
          Work
        </button>
      ) : null}
      <button type="button" onClick={() => onJump(legs.length - 1)} className="transition-colors hover:text-accent">
        Contact
      </button>
      <WindowShade inline />
    </>
  )
}

/**
 * The fixed top line. It takes the colours of the leg in view, and its links
 * jump along the route. `full` carries the flight details; `lean` keeps the
 * clock, the current leg and the links; `minimal` drops the bar for a name
 * and a contact link floating over the page.
 */
export function FlightStrip({
  active,
  onJump,
  ui,
}: {
  active: number
  onJump: (leg: number) => void
  ui: ChromeDensity
}) {
  const leg = legs[active]
  const now = (
    <>
      <span className="text-ink-faint">Now</span>
      <FlapText text={`${leg.no} ${leg.code}`} length={10} trigger="none" swap="quick" />
    </>
  )

  if (ui === 'minimal') {
    return (
      <header className={`${legClass(leg.id)} flight-strip t-label`} data-ui="minimal">
        <div className="swiss-grid items-baseline py-4">
          <p className="col-span-2 md:col-span-6">Marc Andre Lam</p>
          <nav className="col-span-2 flex items-baseline justify-end gap-5 md:col-span-6">
            <NavLinks onJump={onJump} work={false} />
          </nav>
        </div>
      </header>
    )
  }

  return (
    <header className={`${legClass(leg.id)} flight-strip t-label`} data-ui={ui}>
      <div className="swiss-grid items-baseline py-4">
        <LiveClock className="col-span-2 md:col-span-3" />
        {ui === 'full' ? (
          <>
            <p className="hidden text-ink-faint md:col-span-3 md:block">Flight MAL 001 · NYC → Your inbox</p>
            <p className="hidden gap-2 md:col-span-3 md:flex">{now}</p>
          </>
        ) : (
          <p className="hidden gap-2 md:col-span-3 md:col-start-6 md:flex">{now}</p>
        )}
        <nav className="col-span-2 flex items-baseline justify-end gap-5 md:col-span-3 md:col-start-10">
          {ui === 'full' ? <span className="hidden text-ink-faint lg:inline">Priority boarding</span> : null}
          <NavLinks onJump={onJump} />
        </nav>
      </div>
    </header>
  )
}

/**
 * The in-flight map: a dashed route with a stop per leg, filled in behind a
 * plane as the visitor travels. `stops` place each leg along the route (0–1);
 * the plane follows `--flight-p`. `lean` drops the readout and the section
 * names; `minimal` labels only the leg in view.
 */
export function FlightRail({
  orientation,
  active,
  stops,
  onJump,
  readoutRef,
  ui,
}: {
  orientation: 'h' | 'v'
  active: number
  stops: number[]
  onJump: (leg: number) => void
  readoutRef: React.RefObject<HTMLSpanElement | null>
  ui: ChromeDensity
}) {
  return (
    <nav
      aria-label="Flight progress"
      data-orientation={orientation}
      data-ui={ui}
      className={`${legClass(legs[active].id)} flight-rail t-label`}
    >
      <p className="flight-rail-readout">
        <span className="text-ink-faint">NYC → Inbox</span>
        <span ref={readoutRef} className="flight-rail-readings">
          <span>Alt 0 ft</span>
          <span>0% flown</span>
        </span>
      </p>
      <div className="flight-rail-track">
        <span className="flight-rail-line" />
        <span className="flight-rail-flown" />
        {legs.map((leg, i) => (
          <button
            key={leg.id}
            type="button"
            onClick={() => onJump(i)}
            className="flight-rail-stop"
            style={{ '--at': stops[i] ?? i / (legs.length - 1) } as React.CSSProperties}
            data-passed={i <= active || undefined}
            aria-current={i === active ? 'step' : undefined}
            aria-label={`${leg.code}: ${leg.section}`}
          >
            <span className="flight-rail-dot" />
            <span className="flight-rail-label">
              <span>{leg.code}</span>
              <span className="flight-rail-section text-ink-faint">{leg.section}</span>
            </span>
          </button>
        ))}
        <span className="flight-rail-plane" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
          </svg>
        </span>
      </div>
    </nav>
  )
}
