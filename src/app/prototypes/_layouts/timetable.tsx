'use client'

import Link from 'next/link'
import { useState } from 'react'

import { LiveClock } from '@/components/brand/live-clock'
import { WorkCover } from '@/components/home/work-cover'
import { WindowShade } from '@/components/layout/window-shade'
import { flightCode, indexLabel, seatLabel, type WorkItem } from '@/lib/work-items'
import { site } from '@/../content/site'

import './layouts.css'

type Mode = 'board' | 'manifest'

/**
 * The homepage as a printed departures timetable. The work is a table you can
 * read two ways: the board (each flight a line of display type, the cover in a
 * fixed cell beside it) or the manifest (every field, dense and numbered).
 */
export function Timetable({ items }: { items: WorkItem[] }) {
  const [mode, setMode] = useState<Mode>('board')
  const [active, setActive] = useState(0)
  const years = items.map((item) => item.meta.year)
  const valid = `${Math.min(...years)}–${Math.max(...years)}`

  return (
    <div className="ly-page ly-tt">
      <header className="ly-tt-strip swiss-grid t-label">
        <span className="col-span-2 md:col-span-3">{site.name}</span>
        <span className="col-span-2 md:col-span-2">Timetable · Edition 01</span>
        <span className="hidden md:col-span-2 md:block">Valid {valid}</span>
        <span className="hidden md:col-span-2 md:block">Issued New York</span>
        <span className="col-span-2 md:col-span-1">
          <LiveClock />
        </span>
        <span className="col-span-2 flex justify-end md:col-span-2">
          <WindowShade inline />
        </span>
      </header>

      <section className="swiss-grid gap-y-8 pt-[8vh] pb-16 md:pb-24">
        <h1 className="ly-tt-name col-span-full">{site.name}</h1>
        <p className="ly-tt-lede col-span-full md:col-span-6">{site.headline}</p>
        <p className="col-span-full max-w-[52ch] text-lg text-ink-muted md:col-span-5 md:col-start-8">{site.bio}</p>
      </section>

      <section aria-labelledby="departures" className="pb-24">
        <div className="ly-tt-head swiss-grid items-end gap-y-3">
          <h2 id="departures" className="col-span-full md:col-span-6">
            <span className="ly-tt-h2">Departures</span>
            <span className="t-label ml-3 text-ink-faint">{items.length} flights</span>
          </h2>
          <div role="radiogroup" aria-label="Timetable view" className="ly-seg col-span-full md:col-span-6 md:justify-self-end">
            {(['board', 'manifest'] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={mode === value}
                onClick={() => setMode(value)}
                className="ly-seg-option t-label"
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {mode === 'board' ? (
          <div className="swiss-grid">
            <ol className="col-span-full md:col-span-8">
              {items.map((item, i) => (
                <li key={item.meta.slug} className="ly-tt-row">
                  <Link
                    href={`/work/${item.meta.slug}`}
                    onPointerEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    className="ly-tt-board-link"
                    data-active={active === i || undefined}
                  >
                    <span className="ly-tt-title">
                      {item.meta.title}
                      <sup className="ly-tt-code">{flightCode(item.meta)}</sup>
                    </span>
                    <span className="t-label text-ink-muted">
                      {item.meta.client} · {item.meta.subtitle} · {item.meta.year}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
            <aside aria-label="Selected flight" className="ly-tt-preview hidden md:col-span-4 md:block">
              <div className="ly-tt-preview-inner">
                <div className="aspect-4/5 overflow-hidden">
                  <WorkCover item={items[active]} index={active} sizes="30vw" morph={false} />
                </div>
                <p className="t-label mt-3 flex justify-between text-ink-faint">
                  <span>Gate {seatLabel(active)}</span>
                  <span>{flightCode(items[active].meta)}</span>
                </p>
                <p className="mt-2 text-base leading-snug">{items[active].meta.headline}</p>
              </div>
            </aside>
          </div>
        ) : (
          <div className="ly-tt-table-wrap px-(--page-margin)">
            <table className="ly-tt-table">
              <thead className="t-label text-ink-faint">
                <tr>
                  <th scope="col">N°</th>
                  <th scope="col">Flight</th>
                  <th scope="col">Destination</th>
                  <th scope="col">Service</th>
                  <th scope="col">Dep.</th>
                  <th scope="col">Gate</th>
                  <th scope="col">Role</th>
                  <th scope="col">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.meta.slug}>
                    <td className="font-mono">N°{indexLabel(i).padStart(4, '0')}</td>
                    <td className="font-mono">{flightCode(item.meta)}</td>
                    <th scope="row">
                      <Link href={`/work/${item.meta.slug}`} className="underline decoration-rule underline-offset-4 hover:decoration-accent">
                        {item.meta.title}
                      </Link>
                    </th>
                    <td>{item.meta.subtitle}</td>
                    <td className="font-mono">{item.meta.year}</td>
                    <td className="font-mono">{seatLabel(i)}</td>
                    <td>{item.meta.role}</td>
                    <td className="text-ink-muted">{item.meta.tags.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="info" className="swiss-grid gap-y-6 border-t border-rule pt-10 pb-24">
        <h2 id="info" className="t-label col-span-full text-ink-faint md:col-span-3">
          Passenger information
        </h2>
        <div className="ly-tt-cols col-span-full md:col-span-9">
          <p>{site.bio}</p>
          <p>
            Every flight on this timetable is a community: a student club, a startup showcase, a study-abroad cohort, a
            streetwear label. The work is building the identity those people gather around.
          </p>
          <dl className="ly-tt-contact">
            <div>
              <dt className="t-label text-ink-faint">Enquiries</dt>
              <dd className="select-all">{site.email}</dd>
            </div>
            {site.links.map((link) => (
              <div key={link.label}>
                <dt className="t-label text-ink-faint">{link.label}</dt>
                <dd>
                  <a href={link.href} className="underline decoration-rule underline-offset-4 hover:decoration-accent">
                    {link.label === 'Email' ? 'Write' : 'Open'}
                  </a>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <footer className="ly-tt-belt" aria-label={site.name}>
        <span aria-hidden="true">{site.name}</span>
      </footer>
    </div>
  )
}
