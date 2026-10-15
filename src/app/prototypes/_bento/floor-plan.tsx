'use client'

import Link from 'next/link'
import { startTransition, useEffect, useId, useRef, useState, ViewTransition } from 'react'
import { ArrowRight, Maximize2, Sparkles, X } from 'lucide-react'

import { NameHero } from '@/components/brand/name-hero'
import { WorkCover } from '@/components/home/work-cover'
import { GridOverlay } from '@/components/layout/grid-overlay'
import { BaggageHall } from '@/components/landing/baggage-hall'
import { Pictogram, type PictogramName } from '@/components/landing/sign-nav'
import { LuggageTag, routes, routesOf } from '@/components/landing/tagged-covers'
import { FlapText } from '@/components/split-flap/split-flap'
import { flightCode, type WorkItem } from '@/lib/work-items'
import { site } from '@/../content/site'

import { roles } from '../_flight/legs'
import { PassportBook, PassportCover } from '../_passport/passport-book'
import { ScaleToFit } from './scale-to-fit'
import { BentoBar, ContactTile, Strap, TileHead, wordmarkMotion } from './tiles'

import '../_flight/signs.css'
import '../_baggage/baggage.css'
import '@/components/landing/baggage-hall.css'
import './bento.css'

/** The plan has four gates; with more projects the last one lists the rest. */
const GATES = 4

type SpotId = `gate-${string}` | 'passport' | 'belt' | 'arrivals'

/**
 * C. Terminal floor plan. On a desktop the whole terminal fits one screen:
 * a gate per project, passport control, baggage claim and arrivals, with a
 * corridor of signs down the middle. Pick any of them and it opens out over
 * the plan; Esc or the close control folds it back.
 */
export function FloorPlan({ items }: { items: WorkItem[] }) {
  const [open, setOpen] = useState<SpotId | null>(null)
  const opener = useRef<HTMLElement | null>(null)
  const last = useRef<SpotId | null>(null)
  const gates = items.length > GATES ? items.slice(0, GATES - 1) : items.slice(0, GATES)
  const overflow = items.length > GATES ? items.slice(GATES - 1) : []

  const show = (id: SpotId, event: React.MouseEvent<HTMLElement>) => {
    opener.current = event.currentTarget
    last.current = id
    startTransition(() => setOpen(id))
  }
  const close = () => startTransition(() => setOpen(null))

  // Esc folds the open spot back, and focus goes back to whatever opened it
  // (or, if that tile was swapped out while open, to its replacement).
  useEffect(() => {
    if (!open) {
      const el = opener.current?.isConnected ? opener.current : document.querySelector<HTMLElement>(`[data-spot="${last.current}"]`)
      el?.focus({ preventScroll: true })
      return
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const gateId = (item: WorkItem) => `gate-${item.meta.slug}` as SpotId
  const openItem = items.find((item) => gateId(item) === open)

  // The corridor's signs: every spot on the plan, in walking order.
  const signs: Array<{ id: SpotId; code: string; label: string; picto: PictogramName }> = [
    ...items.map((item, i) => ({ id: gateId(item), code: `A${i + 1}`, label: item.meta.title, picto: 'plane' as const })),
    { id: 'passport', code: 'P', label: 'Passport control', picto: 'info' },
    { id: 'belt', code: 'B', label: 'Baggage claim', picto: 'suitcase' },
    { id: 'arrivals', code: 'X', label: 'Arrivals', picto: 'envelope' },
  ]

  return (
    <div className="bento bento-floor">
      <BentoBar current="C" />

      <div className="bento-pad">
        <div className="floor-grid" data-open={open ?? undefined}>
          <section className="tile fp-sign" aria-label="Terminal M">
            <TileHead no="M" label="Terminal" picto="plane" aside="NYC · Departures level" />
            <div className="tile-body flex flex-col justify-between gap-4 p-4 md:p-5">
              <NameHero name={site.name} face="led" stack="narrow" motion={wordmarkMotion} intro="auto" loadDelay={150} />
              <Strap className="fp-strap" />
            </div>
          </section>

          {gates.map((item, i) => {
            const id = gateId(item)
            if (open === id) return <div key={id} className={`tile fp-gate fp-gate-${i + 1}`} data-away />
            return (
              <ViewTransition key={id} name={`fp-${id}`} share="morph" default="none">
                <button type="button" className={`tile fp-gate fp-gate-${i + 1}`} data-spot={id} onClick={(event) => show(id, event)} aria-label={`Gate A${i + 1}: ${item.meta.title}, ${item.meta.subtitle}`}>
                  <TileHead no={`A${i + 1}`} label="Gate" aside={flightCode(item.meta)} />
                  <span className="fp-gate-cover">
                    <WorkCover item={item} index={items.indexOf(item)} sizes="(min-width: 1024px) 25vw, 100vw" />
                  </span>
                  <span className="fp-gate-caption">
                    <span className="truncate text-[18px] leading-6 font-medium">{item.meta.title}</span>
                    <span className="t-label truncate text-ink-faint">{item.meta.subtitle} · {item.meta.year}</span>
                  </span>
                </button>
              </ViewTransition>
            )
          })}
          {overflow.length ? (
            <section className="tile fp-gate fp-gate-4" aria-label="More gates">
              <TileHead no={`A${GATES}–A${items.length}`} label="Gates" />
              <ul className="tile-body t-label p-4">
                {overflow.map((item) => (
                  <li key={item.meta.slug} className="border-b border-rule py-2 last:border-0">
                    <button type="button" onClick={(event) => show(gateId(item), event)} className="flex w-full justify-between gap-3 hover:text-accent">
                      <span>{item.meta.title}</span>
                      <span className="text-ink-faint">{flightCode(item.meta)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {open === 'passport' ? (
            <div className="tile fp-pass" data-away />
          ) : (
            <ViewTransition name="fp-passport" share="morph" default="none">
              <button type="button" className="tile fp-pass" data-spot="passport" onClick={(event) => show('passport', event)} aria-label="Passport control: open the passport">
                <TileHead no="P" label="Passport control" picto="info" aside={`${roles.length} stamps`} />
                <span className="fp-pass-body">
                  <ScaleToFit width={500} height={560} className="fp-pass-cover">
                    <PassportCover />
                  </ScaleToFit>
                  <span className="flex flex-col justify-center gap-2">
                    <span className="text-[22px] leading-7 font-medium">Hi, I’m Marc<span className="text-accent">.</span></span>
                    <span className="passport-bio text-[14px] leading-5 text-ink-muted">{site.bio}</span>
                    <span className="t-label"><span className="text-ink-faint">Now · </span>{roles[0].role}, {roles[0].org}</span>
                  </span>
                </span>
              </button>
            </ViewTransition>
          )}

          <nav className="tile fp-hall" aria-label="Terminal directory">
            <TileHead no="→" label="Corridor" />
            <ul className="tile-body fp-signs">
              {signs.map((sign) => (
                <li key={sign.id}>
                  <button type="button" className="fp-signpost" onClick={(event) => show(sign.id, event)} aria-current={open === sign.id ? 'location' : undefined}>
                    <span className="fp-signpost-code">{sign.code}</span>
                    <Pictogram name={sign.picto} />
                    <span className="truncate">{sign.label}</span>
                    <ArrowRight size={14} aria-hidden="true" className="ml-auto shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {open === 'belt' ? (
            <div className="tile fp-belt" data-away />
          ) : (
            <ViewTransition name="fp-belt" share="morph" default="none">
              <section className="tile fp-belt tile-belt" aria-label="Baggage claim">
                <TileHead no="B" label="Baggage claim" picto="suitcase" aside={<ExpandButton spot="belt" label="Open baggage claim" onClick={(event) => show('belt', event)} />} />
                <div className="bento-belt">
                  <BaggageHall items={items} />
                </div>
              </section>
            </ViewTransition>
          )}

          {open === 'arrivals' ? (
            <div className="tile fp-arr" data-away />
          ) : (
            <ViewTransition name="fp-arrivals" share="morph" default="none">
              <div className="fp-arr fp-arr-wrap">
                <ContactTile className="h-full" no="X" />
                <ExpandButton spot="arrivals" label="Open arrivals" onClick={(event) => show('arrivals', event)} className="fp-arr-expand" />
              </div>
            </ViewTransition>
          )}

          {open ? (
            <ViewTransition name={`fp-${open}`} share="morph" default="none">
              <section className="tile fp-panel" aria-label="Opened" data-lenis-prevent>
                <PanelHead open={open} item={openItem} items={items} onClose={close} />
                <div className="fp-panel-body">
                  {openItem ? <GatePanel item={openItem} index={items.indexOf(openItem)} /> : null}
                  {open === 'passport' ? <PassportPanel /> : null}
                  {open === 'belt' ? <div className="bento-belt fp-panel-belt"><BaggageHall items={items} /></div> : null}
                  {open === 'arrivals' ? <ArrivalsPanel /> : null}
                </div>
              </section>
            </ViewTransition>
          ) : null}
        </div>
      </div>
      <GridOverlay />
    </div>
  )
}

function ExpandButton({ spot, label, onClick, className }: { spot: SpotId; label: string; onClick: (event: React.MouseEvent<HTMLElement>) => void; className?: string }) {
  return (
    <button type="button" data-spot={spot} className={['fp-expand', className].filter(Boolean).join(' ')} onClick={onClick} aria-label={label} title={label}>
      <Maximize2 size={13} aria-hidden="true" />
    </button>
  )
}

function PanelHead({ open, item, items, onClose }: { open: SpotId; item?: WorkItem; items: WorkItem[]; onClose: () => void }) {
  const titles: Record<string, [string, string]> = {
    passport: ['P', 'Passport control'],
    belt: ['B', 'Baggage claim'],
    arrivals: ['X', 'Arrivals'],
  }
  const [no, label] = item ? [`A${items.indexOf(item) + 1}`, `Gate · ${item.meta.title}`] : titles[open]
  return (
    <header className="tile-head t-label">
      <span className="flex items-center gap-2">
        <span className="text-ink-faint">{no}</span>
        <span>{label}</span>
      </span>
      <button type="button" className="bento-button t-label" onClick={onClose} autoFocus>
        Back to the plan <X size={14} aria-hidden="true" />
      </button>
    </header>
  )
}

/** A gate opened out: the cover, the flight details, and the way to board (the case study). */
function GatePanel({ item, index }: { item: WorkItem; index: number }) {
  const { meta } = item
  const flight = flightCode(meta)
  const flown = routesOf(meta)
  return (
    <div className="fp-gate-panel">
      <div className="fp-gate-panel-cover">
        <WorkCover item={item} index={index} sizes="(min-width: 1024px) 55vw, 100vw" />
        <LuggageTag meta={meta} />
      </div>
      <div className="flex min-h-0 flex-col justify-between gap-6">
        <div>
          <p className="t-label text-ink-faint">Flight</p>
          <FlapText text={flight} className="fp-flight" intro="quick" />
          <h2 className="mt-4 text-[clamp(1.75rem,2.6vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.03em]">{meta.headline}</h2>
          <p className="t-label mt-3 flex flex-wrap gap-1.5">
            {flown.map((route) => (
              <span key={route} className="route-pill" style={{ background: routes[route].fill, color: routes[route].ink }}>{route}</span>
            ))}
          </p>
        </div>
        <dl className="t-label grid grid-cols-2 gap-x-6 gap-y-4">
          <div><dt className="text-ink-faint">Client</dt><dd className="mt-1">{meta.client ?? meta.title}</dd></div>
          <div><dt className="text-ink-faint">Year</dt><dd className="mt-1">{meta.year}</dd></div>
          {meta.role ? <div className="col-span-2"><dt className="text-ink-faint">Role</dt><dd className="mt-1">{meta.role}</dd></div> : null}
          {meta.timeline ? <div><dt className="text-ink-faint">Timeline</dt><dd className="mt-1">{meta.timeline}</dd></div> : null}
          {meta.team ? <div><dt className="text-ink-faint">Crew</dt><dd className="mt-1">{meta.team}</dd></div> : null}
        </dl>
        <Link href={`/work/${meta.slug}`} transitionTypes={['nav-forward']} className="bento-board-link">
          Board flight {flight} <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}

function PassportPanel() {
  const spreadId = useId()
  const [open, setOpen] = useState(false)
  const [lightPass, setLightPass] = useState(0)

  // The cover lands closed, then swings open.
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timer = window.setTimeout(() => setOpen(true), reduced ? 0 : 420)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="fp-passport-panel">
      <PassportBook open={open} onOpen={() => setOpen(true)} lightPass={lightPass} spreadId={spreadId} />
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" className="bento-button bento-button-quiet t-label" onClick={() => setLightPass((value) => value + 1)}>
          <Sparkles size={14} aria-hidden="true" /> Catch the light
        </button>
        <button type="button" className="bento-button bento-button-quiet t-label" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls={spreadId}>
          {open ? 'Close passport' : 'Open passport'}
        </button>
      </div>
    </div>
  )
}

function ArrivalsPanel() {
  return (
    <div className="fp-arrivals-panel">
      <p className="t-label text-ink-faint">Next destination</p>
      <p className="mt-3 text-[clamp(2.25rem,5vw,5rem)] leading-[0.95] font-medium tracking-[-0.045em]">Your team.</p>
      <a href={`mailto:${site.email}`} className="bento-board-link mt-8">
        {site.email} <ArrowRight size={18} aria-hidden="true" />
      </a>
      <ContactTile className="mt-10" no="X" wide />
    </div>
  )
}
