'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

import { LiveClock } from '@/components/brand/live-clock'
import { WorkCover } from '@/components/home/work-cover'
import { Pictogram, type PictogramName } from '@/components/landing/sign-nav'
import { WindowShade } from '@/components/layout/window-shade'
import { flightCode, type WorkItem } from '@/lib/work-items'
import { site } from '@/../content/site'

import './seatback.css'

type View =
  | { name: 'home' }
  | { name: 'movies' }
  | { name: 'movie'; index: number }
  | { name: 'map' }
  | { name: 'music' }
  | { name: 'shop' }
  | { name: 'info' }
  | { name: 'attendant' }

type Section = Exclude<View['name'], 'home' | 'movie'>

const tiles: Array<{ view: Section; label: string; note: string; picto: PictogramName | 'note'; tone: string; ink: string }> = [
  { view: 'movies', label: 'Movies', note: 'Selected work', picto: 'suitcase', tone: 'var(--brand-blue)', ink: '#ffffff' },
  { view: 'map', label: 'Flight map', note: 'About the route', picto: 'plane', tone: '#10364b', ink: '#f2f8fa' },
  { view: 'music', label: 'Music', note: 'Studio playlists', picto: 'note', tone: 'var(--brand-pink)', ink: '#0a0f1f' },
  { view: 'shop', label: 'Duty free', note: 'Scraps & experiments', picto: 'suitcase', tone: 'var(--brand-green)', ink: '#0a0f1f' },
  { view: 'info', label: 'Information', note: 'Your captain today', picto: 'info', tone: '#10364b', ink: '#f2f8fa' },
  { view: 'attendant', label: 'Call attendant', note: 'Get in touch', picto: 'envelope', tone: 'var(--brand-blue)', ink: '#ffffff' },
]

const titles: Record<View['name'], string> = {
  home: 'Welcome aboard',
  movies: 'Movies',
  movie: 'Movies',
  map: 'Flight map',
  music: 'Music',
  shop: 'Duty free',
  info: 'Information',
  attendant: 'Call attendant',
}

/**
 * Moves focus to the nearest focusable in the arrow's direction, the way a
 * seatback remote steps between tiles. Distance along the arrow counts, and
 * sideways drift counts double, so ↓ picks the tile below over one diagonal.
 */
function stepFocus(root: HTMLElement, key: string) {
  const items = [...root.querySelectorAll<HTMLElement>('[data-sb-focus]')].filter((el) => el.offsetParent !== null)
  if (!items.length) return
  const current = document.activeElement as HTMLElement | null
  if (!current || !items.includes(current)) {
    items[0].focus()
    return
  }
  const from = current.getBoundingClientRect()
  const cx = from.left + from.width / 2
  const cy = from.top + from.height / 2
  let best: HTMLElement | null = null
  let bestScore = Infinity
  for (const el of items) {
    if (el === current) continue
    const box = el.getBoundingClientRect()
    const dx = box.left + box.width / 2 - cx
    const dy = box.top + box.height / 2 - cy
    const along = key === 'ArrowRight' ? dx : key === 'ArrowLeft' ? -dx : key === 'ArrowDown' ? dy : -dy
    const across = key === 'ArrowRight' || key === 'ArrowLeft' ? Math.abs(dy) : Math.abs(dx)
    if (along <= 1) continue
    const score = along + across * 2
    if (score < bestScore) {
      bestScore = score
      best = el
    }
  }
  best?.focus()
}

/**
 * The site as an in-flight entertainment system. Movies are the case studies,
 * the flight map is the about page, the call button is contact. A remote is
 * built in: arrows step between tiles, Enter opens, Escape goes back.
 */
export function Seatback({ items }: { items: WorkItem[] }) {
  const [view, setView] = useState<View>({ name: 'home' })
  const screen = useRef<HTMLDivElement>(null)
  const viewport = useRef<HTMLDivElement>(null)

  const back = useCallback(() => {
    setView((v) => (v.name === 'movie' ? { name: 'movies' } : { name: 'home' }))
  }, [])

  // Each new view starts with the remote on its first tile.
  useEffect(() => {
    viewport.current?.scrollTo({ top: 0 })
    viewport.current?.querySelector<HTMLElement>('[data-sb-focus]')?.focus({ preventScroll: true })
  }, [view])

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape' && view.name !== 'home') {
      event.preventDefault()
      back()
      return
    }
    if (event.key.startsWith('Arrow') && screen.current) {
      event.preventDefault()
      stepFocus(screen.current, event.key)
    }
  }

  return (
    <div className="sb-cabin">
      <div className="sb-seat">
        <div ref={screen} className="sb-screen" onKeyDown={onKeyDown}>
          <header className="sb-topbar t-label">
            <span className="sb-brand">MAL Air</span>
            <span className="hidden md:inline">Flight MAL25 · NYC → Anywhere</span>
            <span className="sb-seatbelt" title="Fasten seatbelt">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 9h10v3a5 5 0 0 1-10 0z M12 4v5" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span className="sr-only">Seatbelt sign on</span>
            </span>
            <LiveClock className="ml-auto" />
          </header>

          <div className="sb-titlebar">
            {view.name !== 'home' ? (
              <button type="button" onClick={back} className="sb-back t-label" data-sb-focus>
                ← Back
              </button>
            ) : null}
            <h1 className="sb-title">{view.name === 'movie' ? items[view.index].meta.title : titles[view.name]}</h1>
          </div>

          <div ref={viewport} className="sb-view">
            {view.name === 'home' ? (
              <div className="sb-tiles">
                {tiles.map((tile) => (
                  <button
                    key={tile.view}
                    type="button"
                    data-sb-focus
                    onClick={() => setView({ name: tile.view } as View)}
                    className="sb-tile"
                    style={{ '--tile': tile.tone, '--tile-ink': tile.ink } as React.CSSProperties}
                  >
                    <span className="sb-tile-icon">
                      {tile.picto === 'note' ? (
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="sign-picto">
                          <path d="M9 18V5l11-2v13" />
                          <circle cx="6" cy="18" r="3" />
                          <circle cx="17" cy="16" r="3" />
                        </svg>
                      ) : (
                        <Pictogram name={tile.picto} />
                      )}
                    </span>
                    <span className="sb-tile-label">{tile.label}</span>
                    <span className="sb-tile-note t-label">{tile.note}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {view.name === 'movies' ? (
              <ul className="sb-posters">
                {items.map((item, i) => (
                  <li key={item.meta.slug}>
                    <button type="button" data-sb-focus onClick={() => setView({ name: 'movie', index: i })} className="sb-poster">
                      <span className="sb-poster-art">
                        <WorkCover item={item} index={i} sizes="(min-width: 768px) 20vw, 45vw" morph={false} />
                      </span>
                      <span className="sb-poster-title">{item.meta.title}</span>
                      <span className="t-label sb-dim">
                        {flightCode(item.meta)} · {item.meta.year}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {view.name === 'movie' ? <MovieDetail item={items[view.index]} index={view.index} /> : null}
            {view.name === 'map' ? <FlightMap /> : null}
            {view.name === 'music' ? <Music items={items} /> : null}
            {view.name === 'shop' ? <DutyFree /> : null}
            {view.name === 'info' ? <Info /> : null}
            {view.name === 'attendant' ? <Attendant /> : null}
          </div>

          <footer className="sb-statusbar t-label">
            <button type="button" onClick={() => setView({ name: 'home' })} className="sb-home" data-sb-focus>
              Home
            </button>
            <span className="sb-dim hidden md:inline">Remote: ← ↑ → ↓ · Enter · Esc</span>
            <span className="sb-brightness">
              <WindowShade inline />
            </span>
          </footer>
        </div>

        <div className="sb-hardware t-label" aria-hidden="true">
          <span className="sb-jack">
            <i /> Audio
          </span>
          <span className="sb-latch" />
          <span className="sb-jack">
            USB <i className="sb-usb" />
          </span>
        </div>
      </div>
    </div>
  )
}

function MovieDetail({ item, index }: { item: WorkItem; index: number }) {
  const { meta } = item
  return (
    <div className="sb-detail">
      <div className="sb-detail-art">
        <WorkCover item={item} index={index} sizes="(min-width: 768px) 30vw, 90vw" morph={false} />
      </div>
      <div className="grid content-start gap-5">
        <p className="t-label sb-dim">
          {flightCode(meta)} · {meta.year} · {meta.subtitle}
        </p>
        <p className="sb-detail-headline">{meta.headline}</p>
        <dl className="sb-facts">
          <div>
            <dt className="t-label sb-dim">Starring</dt>
            <dd>{meta.role}</dd>
          </div>
          <div>
            <dt className="t-label sb-dim">Runtime</dt>
            <dd>{meta.timeline}</dd>
          </div>
          <div>
            <dt className="t-label sb-dim">Cast</dt>
            <dd>{meta.team}</dd>
          </div>
          <div>
            <dt className="t-label sb-dim">Studio</dt>
            <dd>{meta.client}</dd>
          </div>
        </dl>
        <Link href={`/work/${meta.slug}`} className="sb-play" data-sb-focus>
          ▶ Watch now
        </Link>
      </div>
    </div>
  )
}

// Equirectangular placement on a 360 × 180 box.
const NYC = { x: 180 - 74, y: 90 - 40.7 }
const SYD = { x: 180 + 151.2, y: 90 + 33.9 }

function FlightMap() {
  return (
    <div className="sb-map-wrap">
      <figure className="sb-map">
        <svg viewBox="0 0 360 180" role="img" aria-label="Route map from New York to Sydney">
          {Array.from({ length: 11 }, (_, i) => (
            <line key={`v${i}`} x1={i * 36} y1="0" x2={i * 36} y2="180" className="sb-graticule" />
          ))}
          {Array.from({ length: 6 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 36} x2="360" y2={i * 36} className="sb-graticule" />
          ))}
          <path d={`M${NYC.x} ${NYC.y} Q 250 -10 ${SYD.x} ${SYD.y}`} className="sb-route" />
          <path d={`M${NYC.x} ${NYC.y} Q 250 -10 ${SYD.x} ${SYD.y}`} className="sb-route-done" pathLength={100} />
          {[
            { ...NYC, label: 'NYC', note: 'tech@nyu · Startup Week · Shmeel' },
            { ...SYD, label: 'SYD', note: 'NYU Sydney' },
          ].map((p) => (
            <g key={p.label}>
              <circle cx={p.x} cy={p.y} r="3" className="sb-city" />
              <text x={p.x} y={p.y - 7} textAnchor="middle" className="sb-city-label">
                {p.label}
              </text>
            </g>
          ))}
        </svg>
        <figcaption className="sr-only">New York to Sydney: four projects across two cities.</figcaption>
      </figure>
      <div className="sb-readout">
        <dl className="sb-facts sb-facts-2">
          <div>
            <dt className="t-label sb-dim">Origin</dt>
            <dd>New York</dd>
          </div>
          <div>
            <dt className="t-label sb-dim">Stopover</dt>
            <dd>Sydney, Fall 2025</dd>
          </div>
          <div>
            <dt className="t-label sb-dim">Distance</dt>
            <dd>16,014 km</dd>
          </div>
          <div>
            <dt className="t-label sb-dim">Altitude</dt>
            <dd>37,000 ft</dd>
          </div>
        </dl>
        <p className="sb-bio">{site.bio}</p>
        <button type="button" data-sb-focus className="sb-chip t-label">
          Projects on this route: 4
        </button>
      </div>
    </div>
  )
}

function Music({ items }: { items: WorkItem[] }) {
  return (
    <ol className="sb-tracks">
      {items.map((item, i) => (
        <li key={item.meta.slug}>
          <button type="button" data-sb-focus className="sb-track">
            <span className="sb-track-no">{String(i + 1).padStart(2, '0')}</span>
            <span className="grid">
              <span className="sb-track-title">Studio mix: {item.meta.title}</span>
              <span className="t-label sb-dim">Placeholder · add the playlist from making {flightCode(item.meta)}</span>
            </span>
            <span className="t-label sb-dim">— : —</span>
          </button>
        </li>
      ))}
    </ol>
  )
}

function DutyFree() {
  return (
    <div className="sb-shop">
      <Link href="/scraps" className="sb-shop-item" data-sb-focus>
        <span className="sb-tile-label">Scraps</span>
        <span className="t-label sb-dim">Experiments and loose ends</span>
      </Link>
      <Link href="/prototypes" className="sb-shop-item" data-sb-focus>
        <span className="sb-tile-label">Prototypes</span>
        <span className="t-label sb-dim">Layout ideas, like this one</span>
      </Link>
    </div>
  )
}

function Info() {
  return (
    <div className="grid max-w-[60ch] gap-6">
      <p className="sb-detail-headline">{site.headline}</p>
      <p className="sb-bio">{site.bio}</p>
      <ul className="flex flex-wrap gap-3">
        {site.links.map((link) => (
          <li key={link.label}>
            <a href={link.href} className="sb-chip t-label" data-sb-focus target={link.kind === 'external' ? '_blank' : undefined} rel="noreferrer">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Attendant() {
  const [called, setCalled] = useState(false)
  return (
    <div className="sb-attendant">
      <button type="button" data-sb-focus onClick={() => setCalled((c) => !c)} className="sb-call" aria-pressed={called}>
        <span className="sb-call-light" aria-hidden="true" />
        {called ? 'Attendant called' : 'Call attendant'}
      </button>
      <div className="grid content-start gap-3">
        <p className="sb-bio">{called ? 'Marc will be with you shortly. Write to:' : 'Press the button, or write directly:'}</p>
        <p className="sb-detail-headline select-all">{site.email}</p>
        <a href={site.links.find((l) => l.label === 'LinkedIn')?.href} target="_blank" rel="noreferrer" className="sb-chip t-label w-fit" data-sb-focus>
          LinkedIn
        </a>
      </div>
    </div>
  )
}
