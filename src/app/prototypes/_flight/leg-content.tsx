'use client'

import { useEffect, useState } from 'react'

import { NameHero } from '@/components/brand/name-hero'
import { FlapText, SplitFlap } from '@/components/split-flap/split-flap'
import { BoardingPass } from '@/components/work/boarding-pass'
import type { FlapMotion } from '@/lib/flap-motion'
import { asset } from '@/lib/paths'
import type { WorkItem } from '@/lib/work-items'
import { site } from '@/../content/site'

import { carryOn, results, roles } from './legs'
import { OverheadBin } from './overhead-bin'
import { useSeen } from './use-flight'

type Dir = 'v' | 'h'

/** "Scroll on" in the direction the trip travels: down, or (from tablet up) across. */
function Onward({ dir }: { dir: Dir }) {
  if (dir === 'v') return <>↓</>
  return (
    <>
      <span className="md:hidden">↓</span>
      <span className="hidden md:inline">→</span>
    </>
  )
}

const destinations = ['Brand', 'Social', 'Content']

/* -------------------------------------------------------------------------- */

export function GateLeg({
  dir,
  motion,
  motionKey = 'stock',
  replay = 0,
}: {
  dir: Dir
  /** Wordmark flip timing under evaluation, and a name for it (a change remounts the wordmark). */
  motion?: FlapMotion
  motionKey?: string
  /** Bumped to play the wordmark's full first-visit cascade again. */
  replay?: number
}) {
  const flight: Array<[string, string]> = [
    ['Flight', 'MAL 001'],
    ['From', 'NYC'],
    ['To', 'Your team'],
    ['Gate', '01'],
  ]
  return (
    <div className="swiss-grid h-full min-h-[inherit] content-between gap-y-12 pt-24 pb-28">
      <dl data-detail className="t-label col-span-2 grid grid-cols-[auto_1fr] gap-x-4 md:col-span-3">
        {flight.map(([label, value], i) => (
          <div key={label} className="col-span-2 grid grid-cols-subgrid">
            <dt className="text-ink-faint">{label}</dt>
            <dd>
              <FlapText text={value} intro="quick" delay={{ first: 1300 + i * 90, repeat: 300 + i * 90 }} />
            </dd>
          </div>
        ))}
      </dl>
      <ul className="t-label col-span-2 md:col-span-3">
        <li className="text-ink-faint">Now boarding</li>
        {destinations.map((d, i) => (
          <li key={d}>
            <FlapText text={d} intro="quick" delay={{ first: 1500 + i * 90, repeat: 450 + i * 90 }} />
          </li>
        ))}
      </ul>
      <p className="col-span-full text-[clamp(2rem,4.4vw,4rem)] leading-[1.05] font-medium tracking-[-0.035em] text-balance md:col-span-6">
        {site.headline}
      </p>
      <NameHero
        key={`${motionKey}-${replay}`}
        name={site.name}
        motion={motion}
        intro={replay ? 'full' : 'auto'}
        className="col-span-full"
      />
      <div data-detail className="t-label rule-draw col-span-full flex justify-between pt-4">
        <span className="text-ink-faint">01 — Gate · Morning</span>
        <span>
          Scroll to board <Onward dir={dir} />
        </span>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

export function DeparturesHeader({ items }: { items: WorkItem[] }) {
  const years = items.map((item) => item.meta.year)
  return (
    <div className="flex flex-col gap-4">
      <p className="t-label text-ink-faint">
        02 — Departures<span data-detail> · Midday</span>
      </p>
      <h2 className="text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.95] font-medium tracking-[-0.045em]">
        Selected flights
      </h2>
      <p data-detail className="t-label">
        {String(items.length).padStart(2, '0')} flights · {Math.min(...years)}—{Math.max(...years)}
      </p>
    </div>
  )
}

/** Every project as a boarding pass with its headline result above it. */
export function PassList({
  items,
  className,
  ref,
}: {
  items: WorkItem[]
  className?: string
  ref?: React.Ref<HTMLUListElement>
}) {
  return (
    <ul ref={ref} className={['flex flex-col gap-(--gutter) md:flex-row', className].filter(Boolean).join(' ')}>
      {items.map((item, i) => {
        const result = results[item.meta.slug]
        return (
          <li key={item.meta.slug} className="flex flex-col gap-3 md:w-[min(600px,44vw)] md:flex-none">
            {result ? (
              <p
                className={`t-label self-start px-2 py-1 ${result.placeholder ? 'flight-ph' : 'bg-ink text-surface'}`}
                title={result.placeholder ? 'Placeholder: real metric needed' : undefined}
              >
                <span data-detail>Result · </span>
                {result.value}
              </p>
            ) : null}
            <div className="leg-paper">
              <BoardingPass item={item} index={i} variant="card" morph={false} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/* -------------------------------------------------------------------------- */

const clouds = [
  { top: '14%', left: '6%', w: '180px', h: '30px', drift: '22vw' },
  { top: '30%', left: '58%', w: '120px', h: '22px', drift: '46vw' },
  { top: '72%', left: '18%', w: '240px', h: '38px', drift: '14vw' },
  { top: '82%', left: '70%', w: '160px', h: '26px', drift: '34vw' },
  { top: '8%', left: '84%', w: '90px', h: '18px', drift: '60vw' },
]

export function CruiseLeg() {
  const [binOpen, setBinOpen] = useState(false)
  const toggleBin = () => setBinOpen(!binOpen)
  return (
    <div className="relative h-full min-h-[inherit] overflow-hidden">
      <OverheadBin open={binOpen} onToggle={toggleBin} />
      {clouds.map((c, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="flight-cloud"
          style={{ top: c.top, left: c.left, '--w': c.w, '--h': c.h, '--drift': c.drift } as React.CSSProperties}
        />
      ))}
      <div className="swiss-grid relative h-full min-h-[inherit] content-center items-center gap-y-10 pt-24 pb-28">
        <div className="col-span-3 md:col-span-4">
          <div className="flight-window">
            <div className="flight-hatch grid size-full place-items-center">
              <span className="t-label">Portrait · placeholder</span>
            </div>
            <span className="flight-window-blind" aria-hidden="true" />
          </div>
        </div>
        <div className="col-span-full md:col-span-7 md:col-start-6">
          <p className="t-label text-ink-faint">
            03 — Passenger<span data-detail> · Afternoon</span>
          </p>
          <h2 className="mt-4 text-[clamp(1.75rem,3.6vw,3.25rem)] leading-[1.05] font-medium tracking-[-0.035em] text-balance">
            Hi, I’m Marc.<span data-detail> I build brands for communities, not just products.</span>
          </h2>
          <p className="mt-6 max-w-[52ch] text-lg leading-7 text-ink-muted">{site.bio}</p>
          <dl className="t-label mt-10 grid grid-cols-2 gap-x-(--gutter) gap-y-6">
            <div className="col-span-2">
              <dt className="text-ink-faint">Carry-on</dt>
              <dd className="mt-2">
                <button type="button" aria-expanded={binOpen} onClick={toggleBin} className="border border-current px-2 py-1 transition-colors hover:bg-ink hover:text-surface">
                  {binOpen ? `${carryOn.length} items out · Stow them ↑` : `${carryOn.length} items stowed overhead · Open bin ↑`}
                </button>
              </dd>
            </div>
            <div data-detail>
              <dt className="text-ink-faint">Home base</dt>
              <dd>New York City</dd>
            </div>
            <div data-detail>
              <dt className="text-ink-faint">Seat</dt>
              <dd>Window, always</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

const stampPlaces = [
  { left: '0%', top: '2%', r: '-12deg', shape: 'round' },
  { left: '30%', top: '36%', r: '7deg', shape: 'rect' },
  { left: '58%', top: '0%', r: '14deg', shape: 'dashed' },
  { left: '6%', top: '58%', r: '-4deg', shape: 'round' },
]

function Stamp({ role, i }: { role: (typeof roles)[number]; i: number }) {
  const [ref, seen] = useSeen<HTMLDivElement>(0.6)
  const place = stampPlaces[i % stampPlaces.length]
  return (
    <div
      ref={ref}
      className="flight-stamp t-label [--size:124px] md:[--size:164px]"
      data-shape={place.shape}
      data-seen={seen || undefined}
      style={{ left: place.left, top: place.top, '--r': place.r, '--d': `${i * 160}ms` } as React.CSSProperties}
    >
      <span>{role.org}</span>
      <b>{role.stamp}</b>
      <span>{role.when}</span>
    </div>
  )
}

export function LayoverLeg() {
  return (
    <div className="swiss-grid h-full min-h-[inherit] content-center gap-y-10 pt-24 pb-28">
      <header className="col-span-full">
        <p className="t-label text-ink-faint">
          04 — Layovers<span data-detail> · Sunset</span>
        </p>
        <h2 className="mt-4 text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.95] font-medium tracking-[-0.045em]">
          Where I’ve been
        </h2>
      </header>
      <div className="relative col-span-full h-[300px] md:col-span-6 md:h-[min(46svh,400px)]">
        {roles.map((role, i) => (
          <Stamp key={role.role} role={role} i={i} />
        ))}
      </div>
      <table className="t-label col-span-full self-center md:col-span-5 md:col-start-8">
        <caption className="sr-only">Experience</caption>
        <thead className="text-ink-faint">
          <tr className="border-b border-rule">
            <th className="py-2 text-left font-normal">Origin</th>
            <th className="py-2 text-left font-normal">Role</th>
            <th className="py-2 text-right font-normal">Date</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role.role} className="border-b border-rule">
              <td className="py-3 pr-4">{role.org}</td>
              <td className="py-3 pr-4">{role.role}</td>
              <td className="py-3 text-right whitespace-nowrap">{role.when}</td>
            </tr>
          ))}
          <tr data-detail className="bg-ink text-surface">
            <td className="py-3 pr-4 pl-2">Your team</td>
            <td className="py-3 pr-4">Next destination</td>
            <td className="py-3 pr-2 text-right">Boarding</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

export function ArrivalLeg({ onReturn }: { onReturn: () => void }) {
  const [boardRef, seen] = useSeen<HTMLDivElement>(0.6)
  const [status, setStatus] = useState('APPROACH')
  useEffect(() => {
    if (!seen) return
    const timer = window.setTimeout(() => setStatus('LANDED'), 1400)
    return () => clearTimeout(timer)
  }, [seen])

  return (
    <div className="relative h-full min-h-[inherit] overflow-hidden">
      <div className="flight-city" aria-hidden="true" />
      <div className="swiss-grid relative h-full min-h-[inherit] content-center gap-y-12 pt-24 pb-28">
        <p className="t-label col-span-full text-ink-faint">
          05 — Arrivals<span data-detail> · Night</span>
        </p>

        <div ref={boardRef} className="flight-board t-label col-span-full grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-3 md:grid-cols-[auto_auto_1fr_auto]">
          <span data-detail className="hidden text-ink-faint md:block">
            From
          </span>
          <span data-detail className="hidden text-ink-faint md:block">
            Flight
          </span>
          <span className="text-ink-faint">Passenger</span>
          <span className="text-ink-faint">Status</span>
          <span data-detail className="hidden md:block">
            <SplitFlap text="NYC" variant="tile" trigger="visible" intro="quick" />
          </span>
          <span data-detail className="hidden md:block">
            <SplitFlap text="MAL001" variant="tile" trigger="visible" intro="quick" delay={120} />
          </span>
          <span>
            <span className="sr-only">Marc Andre Lam</span>
            <SplitFlap text="MARC ANDRE LAM" variant="tile" trigger="visible" intro="quick" delay={240} />
          </span>
          <span className="flight-board-status">
            <span className="sr-only">{status === 'LANDED' ? 'Landed' : 'On approach'}</span>
            <SplitFlap text={status} length={8} variant="tile" trigger="visible" intro="quick" delay={360} swap="quick" />
          </span>
        </div>

        <a
          href={`mailto:${site.email}`}
          className="col-span-full text-[clamp(1.75rem,5vw,4.5rem)] leading-[1.05] font-medium tracking-[-0.035em] break-all transition-colors hover:text-accent md:col-span-10"
        >
          {site.email}
        </a>

        <div className="t-label rule-draw col-span-full grid grid-cols-subgrid gap-y-3 pt-4">
          <p data-detail className="col-span-2 text-ink-faint md:col-span-3">
            Operated by {site.name}
          </p>
          <ul className="col-span-2 flex gap-4 md:col-span-3">
            {site.links.map((link) => (
              <li key={link.label}>
                <a
                  href={link.kind === 'asset' ? asset(link.href) : link.href}
                  {...(link.kind === 'external' ? { target: '_blank', rel: 'noreferrer' } : {})}
                  className="transition-colors hover:text-accent"
                >
                  {link.label} ↗
                </a>
              </li>
            ))}
          </ul>
          <p className="col-span-2 md:col-span-3">
            <span data-detail className="text-ink-faint">
              Baggage claim ·{' '}
            </span>
            <span className="flight-ph px-1" title="Placeholder: résumé PDF not uploaded yet">
              Résumé.pdf
            </span>
          </p>
          <button
            type="button"
            onClick={onReturn}
            className="col-span-2 text-left transition-colors hover:text-accent md:col-span-3 md:col-start-10 md:text-right"
          >
            Return to gate ↺
          </button>
        </div>
      </div>
    </div>
  )
}
