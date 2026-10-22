'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'

import { HangMargin } from '@/components/layout/hang-margin'
import { scrollToY } from '@/components/layout/smooth-scroll'
import type { ImageEntry } from '@/lib/images'
import { indexLabel, type WorkItem } from '@/lib/work-items'

import { CUT_MS, itemProps, tint, useMenu } from '../_dvd/menu'

import { chapterNumber, clock, type Chapter, type Disc } from './chapters'
import { BarOsd, chapterVars, NEON_VARS, neonSection, OSDS, RailOsd, RemoteOsd, type OsdId } from './osd'
import { useReading } from './reading'

import '../_panel/panel.css'
import './chapters.css'

/*
 * The case study as a disc, carrying the DVD menu (the homepage direction)
 * into the project page. A project opens on its scene selection: the title,
 * then its chapters as thumbnails with the menu's neon frame gliding between
 * them, and tabs for Chapters, Extras and Details. Chapters are the body's
 * own "##" sections, each as long as it takes to read. While you read, an
 * on-screen display tracks the chapter playing; the lab tries it as a bar,
 * a rail or a remote. ◀ ▶ skip chapters, Esc goes back to the scene
 * selection, and the last chapter ends on the next disc.
 */

type Tab = 'chapters' | 'extras' | 'details'

const TABS: { id: Tab; label: string }[] = [
  { id: 'chapters', label: 'Chapters' },
  { id: 'extras', label: 'Extras' },
  { id: 'details', label: 'Details' },
]

const GROUNDS = [
  { id: 'paper', name: 'Paper' },
  { id: 'dark', name: 'Dark' },
] as const

type Ground = (typeof GROUNDS)[number]['id']

/** How long the stage takes to dissolve between tabs. Matches .ch-cut-tab in chapters.css. */
const TAB_CUT_MS = 240

/** Placeholder slots: no project has extras yet, so these only show where they would sit. */
const EXTRAS = [
  { title: 'Trailer', note: 'A short cut of the project' },
  { title: 'Process sketches', note: 'Sketches and early directions' },
  { title: 'Working files', note: 'Frames, spreads and source files' },
  { title: 'Before & after', note: 'What the work replaced' },
]

function useNarrow() {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)')
    const sync = () => setNarrow(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])
  return narrow
}

const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ---- Pieces ---- */

/** A chapter's thumbnail: the cover for the opening chapter where there is one, otherwise a field of its neon, playing while it's selected. */
function SceneThumb({ chapter, cover }: { chapter: Chapter; cover: ImageEntry | null }) {
  return (
    <span className="ch-thumb">
      {cover ? (
        <Image src={cover.src} alt="" fill sizes="(min-width: 768px) 24vw, 90vw" placeholder="blur" blurDataURL={cover.blurDataURL} className="ch-thumb-img" />
      ) : (
        <span className="ch-thumb-field" />
      )}
      <span className="ch-thumb-num" aria-hidden="true">
        {chapterNumber(chapter.index)}
      </span>
      <span className="ch-thumb-time" aria-hidden="true">
        {clock(chapter.seconds)}
      </span>
    </span>
  )
}

/** Special features, as placeholders. Picking one gets the player's ⊘. */
function Extras({ onPick }: { onPick: () => void }) {
  const narrow = useNarrow()
  const { active, setActive, listProps, highlightRef } = useMenu(EXTRAS.length, 'grid', narrow ? 1 : 2)

  return (
    <section className="ch-section swiss-grid" aria-label="Extras">
      <HangMargin>
        <span className="text-ink">Special features</span>
        <span>{EXTRAS.length} slots</span>
      </HangMargin>
      <div className="ch-section-main">
        <p className="ch-section-lead">Nothing is on this disc yet. These slots show where the extras would sit, so the page can be judged with them in.</p>
        <nav aria-label="Extras" className="ch-extras-grid" {...listProps}>
          <span ref={highlightRef} className="ch-hl ch-hl-frame" aria-hidden="true" />
          {EXTRAS.map((extra, i) => (
            <button key={extra.title} type="button" className="ch-extra" style={chapterVars(i)} onClick={onPick} {...itemProps(i, active, setActive)}>
              <span className="ch-extra-slot">
                <span className="ch-extra-chip">Extra {chapterNumber(i)}</span>
                <span className="ch-extra-placeholder">Placeholder</span>
              </span>
              <span className="ch-extra-title">{extra.title}</span>
              <span className="ch-extra-note">{extra.note} goes here.</span>
            </button>
          ))}
        </nav>
      </div>
    </section>
  )
}

/** The disc itself, printed with the cover where there is one, the way a pressing carries its art. */
function DiscArt({ cover, index }: { cover: ImageEntry | null; index: number }) {
  return (
    <figure className="ch-disc-art" style={chapterVars(index)} aria-hidden="true">
      {cover ? <Image src={cover.src} alt="" fill sizes="300px" className="ch-disc-img" /> : <span className="ch-disc-field" />}
      <span className="ch-disc-label">Disc {indexLabel(index)}</span>
    </figure>
  )
}

/** The credits, as on the back of the case: who did what, then the disc's specs. */
function Details({ item, number, chapters, runtime }: { item: WorkItem; number: number; chapters: Chapter[]; runtime: number }) {
  const { meta, cover } = item
  const words = chapters.reduce((sum, c) => sum + c.words, 0)
  const credits: [string, React.ReactNode][] = [
    [
      'Client',
      meta.clientUrl ? (
        <a href={meta.clientUrl} target="_blank" rel="noreferrer">
          {meta.client} ↗
        </a>
      ) : (
        meta.client
      ),
    ],
    ['Role', meta.role],
    ['Timeline', meta.timeline],
    ['Team', meta.team],
    ['Discipline', meta.subtitle],
    ['Tags', meta.tags.join(' · ')],
  ]

  return (
    <section className="ch-section swiss-grid" aria-label="Details">
      <HangMargin>
        <span className="text-ink">Credits</span>
        <span>{meta.year}</span>
      </HangMargin>
      <div className="ch-section-main ch-details">
        <DiscArt cover={cover} index={number} />
        <div className="ch-details-text">
          <dl className="ch-credits">
            {credits.map(([label, value]) => (
              <div key={label}>
                <dt className="t-label">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <ul className="ch-specs" aria-label="Disc specs">
            <li>
              <strong>{chapters.length}</strong> chapters
            </li>
            <li>
              <strong>{clock(runtime)}</strong> runtime
            </li>
            <li>
              <strong>{words}</strong> words
            </li>
            <li>
              <strong>{meta.year}</strong> release
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}

/* ---- One disc ---- */

type DiscProps = {
  item: WorkItem
  disc: Disc
  number: number
  total: number
  next: WorkItem
  osd: OsdId
  cutting: boolean
  onNext: () => void
}

function DiscView({ item, disc, number, total, next, osd, cutting, onNext }: DiscProps) {
  const { meta, cover } = item
  const { chapters, body } = disc
  const runtime = chapters.reduce((sum, c) => sum + c.seconds, 0)
  const rootRef = useRef<HTMLDivElement>(null)
  const readingRef = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])
  const narrow = useNarrow()

  const [tab, setTab] = useState<Tab>('chapters')
  const [switching, setSwitching] = useState(false)
  // A chapter picked from another tab, played once the Chapters tab is back.
  const pending = useRef<number | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const { active: scene, setActive: setScene, listProps: sceneList, highlightRef: sceneHighlight } = useMenu(chapters.length, 'grid', narrow ? 1 : chapters.length)
  const { active: tabFocus, setActive: setTabFocus, listProps: tabList, highlightRef: tabHighlight } = useMenu(TABS.length, 'horizontal')
  const reading = tab === 'chapters' && !switching
  const { current, elapsed, seek } = useReading(rootRef, readingRef, chapters, reading)

  // The scene selection keeps your place: back at the top, the frame is on the chapter you were
  // reading, and both menus return there (and to the open tab) when the pointer leaves them.
  const [followed, setFollowed] = useState(current)
  if (followed !== current) {
    setFollowed(current)
    setScene(current)
  }
  // A tab opened from elsewhere (a scene picked in Extras plays it in Chapters) takes the highlight too.
  const [shownTab, setShownTab] = useState(tab)
  if (shownTab !== tab) {
    setShownTab(tab)
    setTabFocus(TABS.findIndex((t) => t.id === tab))
  }

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const switchTab = (id: Tab) => {
    if (id === tab) return
    setSwitching(true)
    later(
      () => {
        setTab(id)
        setSwitching(false)
      },
      still() ? 0 : TAB_CUT_MS,
    )
  }

  const play = (i: number) => {
    if (tab === 'chapters') return seek(i)
    pending.current = i
    switchTab('chapters')
  }

  useEffect(() => {
    if (pending.current === null || !reading) return
    seek(pending.current)
    pending.current = null
  }, [reading, seek])

  const toMenu = useCallback(() => {
    scrollToY(0)
    rootRef.current?.querySelector<HTMLElement>('.ch-scene-grid [data-active]')?.focus({ preventScroll: true })
  }, [])

  // The remote's other keys: ◀ ▶ skip chapters while reading, Esc goes back to the scene selection.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return
      if ((event.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"], .hl-panel')) return
      if (event.key === 'Escape') {
        event.preventDefault()
        toMenu()
      } else if (tab === 'chapters' && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        event.preventDefault()
        seek(Math.min(chapters.length - 1, Math.max(0, current + (event.key === 'ArrowRight' ? 1 : -1))))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tab, current, chapters.length, seek, toMenu])

  const say = (message: string) => {
    setToast(message)
    later(() => setToast(null), 1800)
  }

  const osdProps = { chapters, current, elapsed, total: runtime, seek, onMenu: toMenu }

  return (
    <div ref={rootRef} className="ch-disc" data-osd={tab === 'chapters' ? osd : undefined} style={tint(neonSection(scene))}>
      <div className="ch-cut" data-cutting={cutting || undefined}>
        <header className="ch-head swiss-grid">
          <HangMargin>
            <span className="text-ink">
              Disc {indexLabel(number)}/{indexLabel(total - 1)}
            </span>
            <span>{meta.year}</span>
          </HangMargin>
          <div className="ch-head-main">
            <p className="t-label text-ink-faint">
              {meta.subtitle} · {meta.client}
            </p>
            <h1 className="ch-title">{meta.title}</h1>
            <p className="ch-headline">{meta.headline}</p>
          </div>
        </header>

        <section className="ch-scenes swiss-grid" aria-label="Scene selection">
          <HangMargin>
            <span className="text-ink">Scene selection</span>
            <span>
              {chapters.length} chapters · {clock(runtime)}
            </span>
          </HangMargin>
          <div className="ch-scenes-main">
            <nav
              aria-label="Chapters"
              className="ch-scene-grid"
              style={{ '--count': chapters.length } as React.CSSProperties}
              onPointerLeave={() => setScene(current)}
              {...sceneList}
            >
              <span ref={sceneHighlight} className="ch-hl ch-hl-frame" aria-hidden="true" />
              {chapters.map((c, i) => (
                <button key={c.index} type="button" className="ch-scene" style={chapterVars(i)} onClick={() => play(i)} {...itemProps(i, scene, setScene)}>
                  <SceneThumb chapter={c} cover={i === 0 ? cover : null} />
                  <span className="ch-scene-caption">
                    <span className="ch-scene-num">{chapterNumber(i)}</span>
                    <span className="ch-scene-title">{c.title}</span>
                    <span className="ch-scene-time">{clock(c.seconds)}</span>
                  </span>
                </button>
              ))}
            </nav>

            <div className="ch-tabbar">
              <div
                role="tablist"
                aria-label="Disc"
                className="ch-tablist"
                onPointerLeave={() => setTabFocus(TABS.findIndex((t) => t.id === tab))}
                {...tabList}
              >
                <span ref={tabHighlight} className="ch-hl ch-hl-mark" aria-hidden="true" />
                {TABS.map((t, i) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    id={`ch-tab-${t.id}`}
                    aria-selected={tab === t.id}
                    aria-controls="ch-stage"
                    className="ch-tab"
                    onClick={() => switchTab(t.id)}
                    {...itemProps(i, tabFocus, setTabFocus)}
                  >
                    <span className="ch-tab-tick" aria-hidden="true">
                      ▶
                    </span>
                    {t.label}
                  </button>
                ))}
              </div>
              <button type="button" className="ch-play" onClick={() => play(0)}>
                <span aria-hidden="true">▶</span> Play all
              </button>
            </div>
          </div>
        </section>

        <div key={tab} id="ch-stage" role="tabpanel" aria-labelledby={`ch-tab-${tab}`} className="ch-stage" data-cutting={switching || undefined}>
          {tab === 'chapters' && (
            <>
              <section className="ch-read swiss-grid" aria-label="Chapters">
                {osd === 'rail' && <RailOsd {...osdProps} />}
                <div ref={readingRef} className="ch-reading">
                  {body}
                </div>
              </section>

              <nav className="ch-next swiss-grid" aria-label="Next disc">
                <HangMargin>
                  <span className="text-ink">End of disc {indexLabel(number)}</span>
                  <span>{clock(runtime)}</span>
                </HangMargin>
                <button type="button" className="ch-next-button" onClick={onNext}>
                  <span className="t-label">
                    <span aria-hidden="true">▶</span> Next disc · {indexLabel((number + 1) % total)}
                  </span>
                  <span className="ch-next-title">{next.meta.title}</span>
                  <span className="t-label text-ink-faint">
                    {next.meta.subtitle} · {next.meta.year}
                  </span>
                </button>
              </nav>
            </>
          )}
          {tab === 'extras' && <Extras onPick={() => say('Not on this disc yet')} />}
          {tab === 'details' && <Details item={item} number={number} chapters={chapters} runtime={runtime} />}
        </div>
      </div>

      {/* Outside the cut, which filters its contents and so would pin fixed things to it rather than the screen. */}
      {tab === 'chapters' && osd === 'bar' && <BarOsd {...osdProps} />}
      {tab === 'chapters' && osd === 'remote' && <RemoteOsd {...osdProps} />}
      <p className="ch-toast" role="status" data-show={toast ? '' : undefined}>
        {toast && (
          <>
            <span className="ch-toast-icon" aria-hidden="true">
              ⊘
            </span>
            {toast}
          </>
        )}
      </p>
    </div>
  )
}

/* ---- The lab ---- */

export function ChaptersLab({ items, discs, fontClass }: { items: WorkItem[]; discs: Disc[]; fontClass: string }) {
  const [osd, setOsd] = useState<OsdId>('bar')
  const [slug, setSlug] = useState(items[0].meta.slug)
  const [ground, setGround] = useState<Ground>('paper')
  const [folded, setFolded] = useState(false)
  const [cutting, setCutting] = useState(false)
  const timer = useRef(0)

  const number = Math.max(0, items.findIndex((item) => item.meta.slug === slug))
  const item = items[number]
  const disc = discs.find((d) => d.slug === slug) ?? discs[0]
  const next = items[(number + 1) % items.length]

  // Changing discs dissolves out, swaps, and starts the new one from the top, as the DVD menu cuts between screens.
  const load = useCallback((target: string) => {
    clearTimeout(timer.current)
    setCutting(true)
    timer.current = window.setTimeout(
      () => {
        setSlug(target)
        setCutting(false)
        scrollToY(0, { immediate: true })
      },
      still() ? 0 : CUT_MS,
    )
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  const note = OSDS.find((o) => o.id === osd)!.note

  return (
    <div className={`ch ${fontClass}`} data-ground={ground} style={NEON_VARS}>
      <DiscView key={slug} item={item} disc={disc} number={number} total={items.length} next={next} osd={osd} cutting={cutting} onNext={() => load(next.meta.slug)} />

      <aside className="hl-panel hl-corner ch-lab-panel" aria-label="Chapters lab" data-folded={folded || undefined}>
        <div className="hl-options" role="radiogroup" aria-label="On-screen display">
          {OSDS.map((option) => (
            <button key={option.id} type="button" role="radio" aria-checked={option.id === osd} className="hl-chip" onClick={() => setOsd(option.id)}>
              {option.name}
            </button>
          ))}
          <button type="button" className="hl-chip hl-fold" onClick={() => setFolded((f) => !f)} aria-expanded={!folded}>
            {folded ? 'Controls' : 'Hide'}
          </button>
        </div>
        <div className="hl-options" role="radiogroup" aria-label="Project">
          {items.map((option) => (
            <button
              key={option.meta.slug}
              type="button"
              role="radio"
              aria-checked={option.meta.slug === slug}
              className="hl-chip"
              onClick={() => option.meta.slug !== slug && load(option.meta.slug)}
            >
              {option.meta.title}
            </button>
          ))}
        </div>
        <div className="hl-options" role="radiogroup" aria-label="Ground">
          {GROUNDS.map((option) => (
            <button key={option.id} type="button" role="radio" aria-checked={option.id === ground} className="hl-chip" onClick={() => setGround(option.id)}>
              {option.name}
            </button>
          ))}
        </div>
        <p className="hl-note">
          {note} ◀ ▶ skip chapters; Esc goes back to the scene selection.
        </p>
      </aside>
    </div>
  )
}
