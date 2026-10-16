'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'

import { LiveClock } from '@/components/brand/live-clock'
import { NameHero } from '@/components/brand/name-hero'
import { WindowShade } from '@/components/layout/window-shade'
import { BaggageHall } from '@/components/landing/baggage-hall'
import { Pictogram, type PictogramName } from '@/components/landing/sign-nav'
import { routes, type Route } from '@/components/landing/tagged-covers'
import { FlapText } from '@/components/split-flap/split-flap'
import { wordmarkMotion } from '@/lib/flap-motion'
import type { WorkItem } from '@/lib/work-items'
import { site } from '@/../content/site'

import { roles } from '../_flight/legs'

/** The three layouts, for the switcher in the bar. */
const layouts = [
  { href: '/prototypes/bento-split', code: 'A', label: 'Split terminal' },
  { href: '/prototypes/bento-board', code: 'B', label: 'Departures board' },
  { href: '/prototypes/bento-floorplan', code: 'C', label: 'Floor plan' },
] as const

export type LayoutCode = (typeof layouts)[number]['code']

/** The slim top bar every layout shares: the way back, the clock, the layout switcher and the shade. */
export function BentoBar({ current }: { current: LayoutCode }) {
  return (
    <header className="bento-bar">
      <div className="swiss-grid h-full items-center">
        <div className="col-span-2 flex items-center gap-6 md:col-span-4">
          <Link href="/prototypes" className="t-label inline-flex items-center gap-2 text-ink-muted hover:text-accent">
            <ArrowLeft size={14} aria-hidden="true" />
            <span className="hidden md:inline">All experiments</span>
            <span className="sr-only md:hidden">All experiments</span>
          </Link>
          <LiveClock className="hidden whitespace-nowrap lg:block" />
        </div>
        <nav aria-label="Bento layouts" className="col-span-2 flex items-center justify-end gap-1 md:col-span-8">
          {layouts.map((layout) => (
            <Link
              key={layout.code}
              href={layout.href}
              aria-current={layout.code === current ? 'page' : undefined}
              className="bento-switch t-label"
            >
              <span>{layout.code}</span>
              <span className="hidden lg:inline">{layout.label}</span>
            </Link>
          ))}
          <span className="ml-3">
            <WindowShade inline />
          </span>
        </nav>
      </div>
    </header>
  )
}

/**
 * A plate in the grid: a sign-style header (number, name and pictogram) over
 * whatever the tile holds. `as` lets a whole tile be a button or link.
 */
export function Tile({
  no,
  label,
  picto,
  aside,
  className,
  bodyClassName,
  children,
  ...rest
}: {
  no: string
  label: string
  picto?: PictogramName
  aside?: React.ReactNode
  className?: string
  bodyClassName?: string
  children: React.ReactNode
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={['tile', className].filter(Boolean).join(' ')} {...rest}>
      <TileHead no={no} label={label} picto={picto} aside={aside} />
      <div className={['tile-body', bodyClassName].filter(Boolean).join(' ')}>{children}</div>
    </section>
  )
}

export function TileHead({ no, label, picto, aside }: { no: string; label: string; picto?: PictogramName; aside?: React.ReactNode }) {
  return (
    <header className="tile-head t-label">
      <span className="flex items-center gap-2">
        {picto ? <span className="tile-picto"><Pictogram name={picto} /></span> : null}
        <span className="text-ink-faint">{no}</span>
        <span>{label}</span>
      </span>
      {aside ? <span className="text-ink-faint">{aside}</span> : null}
    </header>
  )
}

export { wordmarkMotion }

/** The LED wordmark, the headline and the route pills, sized to the tile. */
export function WordmarkTile({ stack = 'narrow', className }: { stack?: 'never' | 'narrow' | 'always'; className?: string }) {
  return (
    <section className={['tile tile-wordmark', className].filter(Boolean).join(' ')} aria-label="Gate">
      <TileHead no="01" label="Gate" picto="plane" aside="NYC · Terminal M" />
      <div className="tile-body flex flex-col justify-between gap-4 p-4 md:p-5">
        <NameHero name={site.name} face="led" stack={stack} motion={wordmarkMotion} intro="auto" loadDelay={150} />
        <Strap />
      </div>
    </section>
  )
}

export function Strap({ className, pills = true }: { className?: string; pills?: boolean }) {
  return (
    <div className={['flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-rule pt-3', className].filter(Boolean).join(' ')}>
      <p className="text-[17px] leading-6 font-medium md:text-[19px]">{site.headline}</p>
      {pills ? (
        <p className="t-label flex flex-wrap items-center gap-1.5">
          {(Object.keys(routes) as Route[]).map((route, i) => (
            <span key={route} className="route-pill" style={{ background: routes[route].fill, color: routes[route].ink }}>
              <FlapText text={route} intro="quick" delay={1300 + i * 90} />
            </span>
          ))}
        </p>
      ) : null}
    </div>
  )
}

/** The baggage belt, scaled to whatever height the tile ends up with. */
export function BeltTile({ items, className, no = '02', aside = 'Pick a bag up' }: { items: WorkItem[]; className?: string; no?: string; aside?: string }) {
  return (
    <section className={['tile tile-belt', className].filter(Boolean).join(' ')} aria-label="Baggage claim">
      <TileHead no={no} label="Baggage claim" picto="suitcase" aside={aside} />
      <div className="bento-belt">
        <BaggageHall items={items} />
      </div>
    </section>
  )
}

/** Arrivals: the clock and every way to get in touch. */
export function ContactTile({ className, no = '04', wide = false }: { className?: string; no?: string; wide?: boolean }) {
  return (
    <section className={['tile tile-contact', className].filter(Boolean).join(' ')} aria-label="Contact">
      <TileHead no={no} label="Arrivals" picto="envelope" aside={wide ? 'Now boarding: your team' : undefined} />
      <div className="tile-body flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 md:px-5">
        <LiveClock className="whitespace-nowrap" />
        <ul className="t-label flex flex-wrap items-center gap-x-5 gap-y-2">
          {site.links.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                {...(link.kind === 'external' ? { target: '_blank', rel: 'noreferrer' } : {})}
                className="inline-flex items-center gap-1 hover:text-accent"
              >
                {link.label === 'Email' ? site.email : link.label}
                <ArrowUpRight size={13} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** Arrivals as a box of its own: where to next, the email up front, the other links and the clock. */
export function ArrivalsTile({ className, no = '06' }: { className?: string; no?: string }) {
  const others = site.links.filter((link) => link.kind !== 'mail')
  return (
    <section className={['tile tile-arrivals', className].filter(Boolean).join(' ')} aria-labelledby="arrivals-title">
      <TileHead no={no} label="Arrivals" picto="envelope" aside={<LiveClock className="inline" />} />
      <div className="tile-body flex flex-col justify-between gap-5 p-4 md:p-5">
        <div>
          <p className="t-label text-ink-faint">Next destination</p>
          <h2 id="arrivals-title" className="mt-1 text-[26px] leading-8 font-medium md:text-[32px] md:leading-10">Your team.</h2>
        </div>
        <div className="flex flex-col gap-3">
          <a href={`mailto:${site.email}`} className="bento-board-link arrivals-email">
            <span className="truncate">{site.email}</span>
            <ArrowUpRight size={18} aria-hidden="true" className="shrink-0" />
          </a>
          <ul className="t-label flex flex-wrap items-center gap-x-5 gap-y-2">
            {others.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  {...(link.kind === 'external' ? { target: '_blank', rel: 'noreferrer' } : {})}
                  className="inline-flex items-center gap-1 hover:text-accent"
                >
                  {link.label}
                  <ArrowUpRight size={13} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

/**
 * Experience as a layovers timetable: every role, newest first, and an open
 * slot at the end for whoever is next.
 */
export function ExperienceTile({ className, no = '03' }: { className?: string; no?: string }) {
  return (
    <section className={['tile tile-experience', className].filter(Boolean).join(' ')} aria-labelledby="layovers-title">
      <TileHead no={no} label="Layovers" picto="escalator" aside={`${roles.length} stops`} />
      <div className="tile-body flex flex-col p-4 md:p-5">
        <h2 id="layovers-title" className="text-[26px] leading-8 font-medium md:text-[32px] md:leading-10">Where I’ve been</h2>
        <table className="t-label experience-table mt-4">
          <caption className="sr-only">Experience</caption>
          <thead className="text-ink-faint">
            <tr className="border-b border-rule">
              <th className="w-16 py-2 text-left font-normal">Stop</th>
              <th className="py-2 text-left font-normal">Role</th>
              <th className="py-2 text-right font-normal">Date</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={`${role.org}-${role.role}`} className="border-b border-rule">
                <td className="pr-3"><span className="bento-stamp">{role.stamp}</span></td>
                <td className="pr-3">
                  <span className="block text-[13px] leading-5 md:text-[14px]">{role.role}</span>
                  <span className="block text-ink-faint">{role.org}</span>
                </td>
                <td className="text-right whitespace-nowrap">{role.when}</td>
              </tr>
            ))}
            <tr className="experience-next">
              <td className="pr-3 pl-2">Next</td>
              <td className="pr-3">Your team</td>
              <td className="pr-2 text-right">Boarding</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
