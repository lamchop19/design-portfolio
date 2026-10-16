'use client'

import { useCallback, useState } from 'react'

import { GridOverlay } from '@/components/layout/grid-overlay'
import { NameHero } from '@/components/brand/name-hero'
import { LiveClock } from '@/components/brand/live-clock'
import type { WorkItem } from '@/lib/work-items'
import { site } from '@/../content/site'

import { PassportOpenTile } from './passport-tile'
import { ArrivalsTile, BeltTile, BentoBar, ExperienceTile, Strap, TileHead, wordmarkMotion } from './tiles'
import { GateCard, RouteFilter, useRouteFilter } from './works'
import { LED_DONE_AT, LED_FLY_AT, LedPreroll } from '@/components/intro/led-preroll'
import { XrayVeil } from './intro/xray-veil'

import '../_flight/signs.css'
import '../_baggage/baggage.css'
import '@/components/landing/baggage-hall.css'
import './bento.css'
import './intro/intro.css'

export type Preroll = 'led' | 'none'
export type Reveal = 'drop' | 'xray' | 'none'

/** When the tile reveal starts, in ms: after the LED intro hands over, or almost at once. */
function revealDelay(preroll: Preroll, reveal: Reveal) {
  if (preroll === 'led') return reveal === 'xray' ? LED_DONE_AT : LED_FLY_AT
  return 150
}

/**
 * B. Departures board. The wordmark is the board across the top. Under it,
 * the passport lies open beside the layovers, then the work gets a row of
 * gates to itself, each lighting up in its own hue. The belt and arrivals
 * share the last row. The whole page scrolls.
 *
 * `preroll` and `reveal` choose a load intro (see /prototypes/bento-intro);
 * by default the page simply appears.
 */
export function DeparturesBoard({
  items,
  preroll = 'none',
  reveal = 'none',
}: {
  items: WorkItem[]
  preroll?: Preroll
  reveal?: Reveal
}) {
  const { route, setRoute, shown } = useRouteFilter(items)
  const years = items.map((item) => item.meta.year)
  const [intro, setIntro] = useState<'pre' | 'done'>(preroll === 'led' ? 'pre' : 'done')
  const [delay, setDelay] = useState(() => revealDelay(preroll, reveal))
  const [scanning, setScanning] = useState(reveal === 'xray')

  // A skipped intro hands over at once, so whatever reveal follows starts now.
  const landed = useCallback((skipped: boolean) => {
    if (skipped) setDelay(0)
    setIntro('done')
  }, [])

  return (
    <div
      className="bento bento-board"
      data-preroll={preroll}
      data-reveal={reveal}
      data-intro={intro}
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
    >
      <BentoBar current="B" />

      <div className="bento-pad board-rows">
        <section className="tile board-head" aria-label="Departures board">
          <TileHead no="01" label="Departures" picto="plane" aside={<LiveClock className="inline" />} />
          <div className="tile-body flex flex-col gap-5 p-4 md:p-6">
            <NameHero name={site.name} face="led" motion={wordmarkMotion} intro="auto" loadDelay={150} />
            <Strap pills={false} />
          </div>
        </section>

        <div className="board-about">
          <PassportOpenTile className="board-passport" no="02" />
          <ExperienceTile className="board-experience" no="03" />
        </div>

        <section className="board-work" aria-labelledby="board-work-title">
          <header className="board-filter t-label">
            <p>
              <span className="text-ink-faint">04 — </span>
              <span id="board-work-title">Selected flights</span>
              <span className="text-ink-faint"> · {String(items.length).padStart(2, '0')} flights · {Math.min(...years)}—{Math.max(...years)}</span>
            </p>
            <RouteFilter value={route} onChange={setRoute} />
          </header>
          <ul className="gate-row" aria-live="polite">
            {shown.map((item) => (
              <li key={item.meta.slug}>
                <GateCard item={item} index={items.indexOf(item)} sizes="(min-width: 1024px) 24vw, (min-width: 768px) 48vw, 100vw" />
              </li>
            ))}
          </ul>
          {shown.length === 0 ? <p className="t-label py-16 text-ink-faint">No flights on this route yet.</p> : null}
        </section>

        <div className="board-arrive">
          <BeltTile items={items} className="board-belt" no="05" />
          <ArrivalsTile className="board-arrivals" no="06" />
        </div>
      </div>
      {intro === 'pre' ? <LedPreroll target=".board-head .flap-wordmark" onDone={landed} /> : null}
      {scanning ? <XrayVeil delay={delay} onDone={() => setScanning(false)} /> : null}
      <GridOverlay />
    </div>
  )
}
