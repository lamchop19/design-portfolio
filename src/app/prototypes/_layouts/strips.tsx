'use client'

import Link from 'next/link'
import { useState } from 'react'

import { LiveClock } from '@/components/brand/live-clock'
import { WorkCover } from '@/components/home/work-cover'
import { WindowShade } from '@/components/layout/window-shade'
import { flightCode, type WorkItem } from '@/lib/work-items'
import { site } from '@/../content/site'

import './layouts.css'

/** Strip holders are colour-coded by discipline, the way controllers sort traffic. */
function holder(subtitle: string) {
  if (subtitle.includes('brand')) return 'var(--brand-blue)'
  if (subtitle.includes('graphic')) return 'var(--brand-pink)'
  return 'var(--brand-green)'
}

type Field = { label: string; value: React.ReactNode; wide?: boolean; big?: boolean }

function Strip({ color, fields, children }: { color: string; fields: Field[]; children?: React.ReactNode }) {
  return (
    <div className="ly-strip" style={{ '--holder': color } as React.CSSProperties}>
      {fields.map((f) => (
        <div key={f.label} className="ly-strip-box" data-wide={f.wide || undefined}>
          <span className="t-label ly-strip-label">{f.label}</span>
          <span className={f.big ? 'ly-strip-big' : 'ly-strip-value'}>{f.value}</span>
        </div>
      ))}
      {children}
    </div>
  )
}

/**
 * The homepage as an air traffic controller's strip bay: one paper strip per
 * project in a coloured holder, every fact in its own ruled box. Pull a strip
 * to read the flight; re-sequence the bay with the arrows.
 */
export function Strips({ items }: { items: WorkItem[] }) {
  const [order, setOrder] = useState(() => items.map((_, i) => i))
  const [open, setOpen] = useState<number | null>(null)

  function move(position: number, by: -1 | 1) {
    const to = position + by
    if (to < 0 || to >= order.length) return
    setOrder((o) => {
      const next = [...o]
      ;[next[position], next[to]] = [next[to], next[position]]
      return next
    })
  }

  return (
    <div className="ly-page ly-st">
      <header className="ly-st-top swiss-grid t-label items-center gap-y-2">
        <span className="col-span-2 md:col-span-4">Strip bay · Sector NYC</span>
        <span className="col-span-2 text-ink-faint md:col-span-4">
          {items.length} active · {open === null ? 'Select a strip to pull it' : 'Strip pulled'}
        </span>
        <span className="col-span-full flex justify-end md:col-span-4">
          <WindowShade inline />
        </span>
      </header>

      <div className="ly-st-bay">
        <h1 className="sr-only">{site.name}</h1>
        <Strip
          color="var(--ink)"
          fields={[
            { label: 'Controller', value: site.name, big: true, wide: true },
            { label: 'Position', value: 'New York' },
            { label: 'Frequency', value: site.headline },
            { label: 'Local', value: <LiveClock /> },
          ]}
        />

        <p className="t-label ly-st-rail">Departures · sequence</p>

        <ol className="grid gap-2">
          {order.map((idx, position) => {
            const item = items[idx]
            const { meta } = item
            const isOpen = open === idx
            return (
              <li key={meta.slug} className="ly-st-slot" data-open={isOpen || undefined}>
                <div className="ly-st-pull">
                  <Strip
                    color={holder(meta.subtitle)}
                    fields={[
                      { label: 'Callsign', value: flightCode(meta), big: true },
                      { label: 'Route', value: `NYC → ${meta.title}`, wide: true },
                      { label: 'Level', value: meta.subtitle },
                      { label: 'Time', value: meta.timeline },
                      { label: 'Remarks', value: meta.role, wide: true },
                    ]}
                  >
                    <div className="ly-strip-controls">
                      <button
                        type="button"
                        className="ly-strip-btn ly-strip-pull"
                        aria-expanded={isOpen}
                        aria-controls={`flight-${meta.slug}`}
                        onClick={() => setOpen(isOpen ? null : idx)}
                      >
                        {isOpen ? 'Push back' : 'Pull strip'}
                      </button>
                      <button
                        type="button"
                        className="ly-strip-btn"
                        aria-label={`Move ${meta.title} up`}
                        disabled={position === 0}
                        onClick={() => move(position, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="ly-strip-btn"
                        aria-label={`Move ${meta.title} down`}
                        disabled={position === order.length - 1}
                        onClick={() => move(position, 1)}
                      >
                        ↓
                      </button>
                    </div>
                  </Strip>
                </div>
                <div id={`flight-${meta.slug}`} className="ly-st-detail" hidden={!isOpen}>
                  <div className="ly-st-detail-grid">
                    <div className="aspect-video overflow-hidden">
                      <WorkCover item={item} index={idx} sizes="(min-width: 768px) 30vw, 100vw" morph={false} />
                    </div>
                    <div className="grid content-start gap-3">
                      <p className="font-display text-[clamp(1.5rem,3vw,2.5rem)] leading-[1.05] tracking-tight text-balance">
                        {meta.headline}
                      </p>
                      <p className="text-ink-muted">
                        {meta.client} · {meta.team} · {meta.tags.join(', ')}
                      </p>
                      <Link href={`/work/${meta.slug}`} className="ly-st-open">
                        Open flight {flightCode(meta)} →
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>

        <p className="t-label ly-st-rail">Notices</p>
        <Strip
          color="var(--brand-green)"
          fields={[
            { label: 'NOTAM', value: 'About', big: true },
            { label: 'Notice', value: site.bio, wide: true },
          ]}
        />
        <Strip
          color="var(--brand-pink)"
          fields={[
            { label: 'Handoff', value: 'Contact', big: true },
            { label: 'Contact', value: <span className="select-all">{site.email}</span>, wide: true },
            {
              label: 'Links',
              value: (
                <span className="flex flex-wrap gap-x-4">
                  {site.links.map((link) => (
                    <a key={link.label} href={link.href} className="underline underline-offset-4">
                      {link.label}
                    </a>
                  ))}
                </span>
              ),
            },
          ]}
        />
      </div>
    </div>
  )
}
