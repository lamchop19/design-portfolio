'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Briefcase, Film, Mail, UserRound, type LucideIcon } from 'lucide-react'

import { LiveClock } from '@/components/brand/live-clock'
import { MetaRail } from '@/components/case-study/meta-rail'
import { asset } from '@/lib/paths'
import { indexLabel, placeholder, type WorkItem } from '@/lib/work-items'
import { site } from '@/../content/site'

import { Backdrop, type BackdropId } from './backdrops'
import { CUT_MS, itemProps, SECTIONS, tint, useMenu, type Section, type SectionId } from './menu'

/*
 * The homepage as a DVD main menu, seven ways. Every layout has the same four
 * items and the same remote-control behaviour (menu.ts); they differ in where
 * the logo and menu sit and what the highlight looks like. Four play over the
 * full-screen scene; Split, Index and Column sit on paper and show the scene
 * in a pane, a window or where you click. Styles in dvd.css.
 */

/** `initial` is the item to land on, so coming back from a section returns to it, as a disc does. */
export type LayoutProps = {
  items: WorkItem[]
  /** Case study bodies by slug, rendered on the server. Only Split opens them. */
  cases: Record<string, React.ReactNode>
  initial: number
  backdrop: BackdropId
  wordmark: WordmarkId
  onSelect: (id: SectionId) => void
}

/* ---- The mark ---- */

/** A striped globe, after the WorldVision Home Video ident. */
export function Globe({ className }: { className?: string }) {
  // Bands thicken toward the equator, like latitude lines seen on a sphere.
  const bands = [-44, -34, -24, -13, -2, 10, 21, 31, 40]
  return (
    <svg viewBox="-50 -50 100 100" className={className} aria-hidden="true">
      <defs>
        <clipPath id="dvd-globe">
          <circle r="48" />
        </clipPath>
      </defs>
      <g clipPath="url(#dvd-globe)" fill="currentColor">
        {bands.map((y, i) => (
          <rect key={y} x="-50" y={y} width="100" height={3 + (4 - Math.abs(4 - i)) * 1.4} />
        ))}
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="3">
        <circle r="47" />
        <ellipse rx="20" ry="47" />
        <ellipse rx="7" ry="47" strokeWidth="9" stroke="var(--bg)" />
      </g>
    </svg>
  )
}

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className="dvd-logo" data-size={size}>
      <Globe className="dvd-logo-globe" />
      <div className="dvd-logo-type">
        <span className="dvd-logo-name">{site.name}</span>
        <span className="dvd-logo-sub">Home Video</span>
        {size !== 'sm' && <span className="dvd-logo-tag">Brand &amp; community design</span>}
      </div>
    </div>
  )
}

/* ---- The wordmark, after homerradio ---- */

export type WordmarkId = 'radio' | 'signal' | 'live' | 'ident'

export const WORDMARKS: { id: WordmarkId; name: string }[] = [
  { id: 'radio', name: 'Radio' },
  { id: 'signal', name: 'Signal' },
  { id: 'live', name: 'Live' },
  { id: 'ident', name: 'Ident' },
]

// The dotted letters run warm to cool across the word, as "radio" does.
const DOT_INKS = ['#ffb000', '#ff4a2e', '#ff3d9a', '#25c46b', '#2a5bff']

function Dots({ text, live }: { text: string; live?: boolean }) {
  const last = Math.max(1, text.length - 1)
  return (
    <span className="dvd-wm-dots">
      {[...text].map((letter, i) => (
        <span
          key={i}
          style={live ? undefined : ({ '--c': DOT_INKS[Math.round((i * (DOT_INKS.length - 1)) / last)] } as React.CSSProperties)}
        >
          {letter}
        </span>
      ))}
    </span>
  )
}

/**
 * The name as one lowercase word, half solid and half in LED dots. Radio dots
 * the surname, Signal the first name, Live dots the surname in whatever
 * colour the menu highlight is, and Ident is the globe mark for comparison.
 */
export function Wordmark({ variant }: { variant: WordmarkId }) {
  if (variant === 'ident') return <Logo size="sm" />
  return (
    <span className="dvd-wm" data-variant={variant}>
      <span className="sr-only">{site.name}</span>
      <span aria-hidden="true">
        {variant === 'signal' ? (
          <>
            <Dots text="marc" />
            <span className="dvd-wm-solid">andrelam</span>
          </>
        ) : (
          <>
            <span className="dvd-wm-solid">marcandre</span>
            <Dots text="lam" live={variant === 'live'} />
          </>
        )}
      </span>
    </span>
  )
}

function Hint({ axis }: { axis: 'vertical' | 'horizontal' | 'grid' }) {
  const arrows = { vertical: '▲ ▼', horizontal: '◀ ▶', grid: '◀ ▲ ▼ ▶' }[axis]
  return (
    <p className="dvd-hint">
      <span>{arrows}</span> Select <span>⏎</span> Play
    </p>
  )
}

/* ---- 1. Feature ---- */

/**
 * The movie disc: logo up top, a stacked menu in the lower left, and a block
 * of neon that slides behind the item you're on, changing colour as it goes.
 */
export function Feature({ initial, onSelect }: LayoutProps) {
  const { active, setActive, listProps, highlightRef } = useMenu(SECTIONS.length, 'vertical', 1, initial)
  const current = SECTIONS[active]

  return (
    <div className="dvd-layout dvd-feature" style={tint(current)}>
      <header className="dvd-feature-logo">
        <Logo />
      </header>
      <nav aria-label="Main menu" className="dvd-feature-menu" {...listProps}>
        <span ref={highlightRef} className="dvd-hl dvd-hl-block" aria-hidden="true" />
        {SECTIONS.map((s, i) => (
          <button key={s.id} type="button" className="dvd-feature-item" onClick={() => onSelect(s.id)} {...itemProps(i, active, setActive)}>
            <span className="dvd-cursor" aria-hidden="true">▶</span>
            <span className="dvd-feature-label">{s.label}</span>
            <span className="dvd-feature-disc">{s.disc}</span>
          </button>
        ))}
      </nav>
      <footer className="dvd-feature-foot">
        <Hint axis="vertical" />
        <p>© {new Date().getFullYear()} {site.name} Home Video</p>
      </footer>
    </div>
  )
}

/* ---- 2. Network ---- */

/**
 * The broadcast ident: one big centred mark like a network logo before the
 * feature, the menu in a single row under it, a pill gliding between items,
 * and scanlines over everything.
 */
export function Network({ initial, onSelect }: LayoutProps) {
  const { active, setActive, listProps, highlightRef } = useMenu(SECTIONS.length, 'horizontal', 1, initial)
  const current = SECTIONS[active]

  return (
    <div className="dvd-layout dvd-network" style={tint(current)}>
      <div className="dvd-network-ident">
        <Logo size="lg" />
      </div>
      <nav aria-label="Main menu" className="dvd-network-menu" {...listProps}>
        <span ref={highlightRef} className="dvd-hl dvd-hl-pill" aria-hidden="true" />
        {SECTIONS.map((s, i) => (
          <button key={s.id} type="button" className="dvd-network-item" onClick={() => onSelect(s.id)} {...itemProps(i, active, setActive)}>
            {s.label}
          </button>
        ))}
      </nav>
      <p className="dvd-network-disc" aria-live="polite">
        {current.disc}
      </p>
      <Hint axis="horizontal" />
      <div className="dvd-scanlines" aria-hidden="true" />
    </div>
  )
}

/* ---- 3. Cross bar ---- */

const ICONS: Record<SectionId, LucideIcon> = { work: Film, experience: Briefcase, about: UserRound, contact: Mail }

/** What each column lists under its icon, as on the PS3's cross media bar. */
function previews(items: WorkItem[]): Record<SectionId, string[]> {
  return {
    work: items.map((item) => item.meta.title),
    experience: site.experience.map((r) => `${r.role}, ${r.org}`),
    about: ['Bio', 'Process', 'Off the clock'],
    contact: [site.email, ...site.links.filter((l) => l.kind !== 'mail').map((l) => l.label)],
  }
}

/**
 * The PS3 menu: a row of icons across the upper third, the one you're on
 * enlarged and glowing, with its contents listed underneath so the menu
 * previews each section before you go in. Clock in the corner.
 */
export function CrossBar({ items, initial, onSelect }: LayoutProps) {
  const { active, setActive, listProps, highlightRef } = useMenu(SECTIONS.length, 'horizontal', 1, initial)
  const current = SECTIONS[active]
  const lists = previews(items)

  return (
    <div className="dvd-layout dvd-xmb" style={{ ...tint(current), '--col': active } as React.CSSProperties}>
      <header className="dvd-xmb-top">
        <Logo size="sm" />
        <LiveClock className="dvd-xmb-clock" />
      </header>
      <nav aria-label="Main menu" className="dvd-xmb-bar" {...listProps}>
        <span ref={highlightRef} className="dvd-hl dvd-hl-glow" aria-hidden="true" />
        {SECTIONS.map((s, i) => {
          const Icon = ICONS[s.id]
          return (
            <button key={s.id} type="button" className="dvd-xmb-item" onClick={() => onSelect(s.id)} {...itemProps(i, active, setActive)}>
              <Icon className="dvd-xmb-icon" strokeWidth={1.25} aria-hidden="true" />
              <span className="dvd-xmb-label">{s.label}</span>
            </button>
          )
        })}
      </nav>
      <ul key={current.id} className="dvd-xmb-list" aria-label={`${current.label} contents`}>
        {lists[current.id].map((line, i) => (
          <li key={line} style={{ '--i': i } as React.CSSProperties}>
            <button type="button" tabIndex={-1} onClick={() => onSelect(current.id)}>
              {line}
            </button>
          </li>
        ))}
      </ul>
      <Hint axis="horizontal" />
    </div>
  )
}

/* ---- 4. Chapters ---- */

/** A thumbnail for each section: the work cover where there is one, otherwise a field of its neon. */
function Thumb({ section, items }: { section: Section; items: WorkItem[] }) {
  const cover = section.id === 'work' ? items.find((item) => item.cover)?.cover : null
  return (
    <span className="dvd-chapter-thumb" style={{ '--c': section.color } as React.CSSProperties}>
      {cover ? (
        <Image src={cover.src} alt="" fill sizes="(min-width: 768px) 36vw, 90vw" className="dvd-chapter-img" />
      ) : (
        <span className="dvd-chapter-field" />
      )}
    </span>
  )
}

/**
 * The scene-selection screen as the homepage: the four sections as chapter
 * thumbnails in a 2×2, numbered, with a neon frame that slides between them.
 */
export function Chapters({ items, initial, onSelect }: LayoutProps) {
  const { active, setActive, listProps, highlightRef } = useMenu(SECTIONS.length, 'grid', 2, initial)
  const current = SECTIONS[active]

  return (
    <div className="dvd-layout dvd-chapters" style={tint(current)}>
      <header className="dvd-chapters-top">
        <Logo size="sm" />
        <p className="dvd-chapters-title">Main Menu</p>
      </header>
      <nav aria-label="Main menu" className="dvd-chapters-grid" {...listProps}>
        <span ref={highlightRef} className="dvd-hl dvd-hl-frame" aria-hidden="true" />
        {SECTIONS.map((s, i) => (
          <button key={s.id} type="button" className="dvd-chapter" onClick={() => onSelect(s.id)} {...itemProps(i, active, setActive)}>
            <Thumb section={s} items={items} />
            <span className="dvd-chapter-caption">
              <span className="dvd-chapter-num">{indexLabel(i)}</span>
              <span className="dvd-chapter-label">{s.label}</span>
              <span className="dvd-chapter-disc">{s.disc}</span>
            </span>
          </button>
        ))}
      </nav>
      <Hint axis="grid" />
    </div>
  )
}

/* ---- 5. Index ---- */

/**
 * After chiquach.com: the name huge in a serif, cropped by the top edge, the
 * scene in a big rounded window bleeding off the right like the X-ray bag,
 * and two small uppercase lists in the lower left: the menu, and the work with
 * years. The window's rim turns the colour of the item you're on.
 */
export function Index({ items, initial, backdrop, onSelect }: LayoutProps) {
  const { active, setActive, listProps, highlightRef } = useMenu(SECTIONS.length, 'vertical', 1, initial)
  const current = SECTIONS[active]

  return (
    <div className="dvd-layout dvd-index" style={tint(current)}>
      <h1 className="dvd-index-name">
        {site.name.split(' ').map((word) => (
          <span key={word}>{word}</span>
        ))}
      </h1>
      <div className="dvd-index-window">
        <Backdrop kind={backdrop} />
        <p className="dvd-index-now">
          {indexLabel(active)} · {current.disc}
        </p>
      </div>
      <div className="dvd-index-lists">
        <nav aria-label="Main menu" className="dvd-index-menu" {...listProps}>
          <span ref={highlightRef} className="dvd-hl dvd-hl-mark" aria-hidden="true" />
          {SECTIONS.map((s, i) => (
            <button key={s.id} type="button" className="dvd-index-item" onClick={() => onSelect(s.id)} {...itemProps(i, active, setActive)}>
              {s.label}
            </button>
          ))}
        </nav>
        <ul className="dvd-index-work" aria-label="Work">
          {items.map((item) => (
            <li key={item.meta.slug}>
              <Link href={`/work/${item.meta.slug}`}>
                {item.meta.title}, {item.meta.year} <span aria-hidden="true">↗</span>
              </Link>
            </li>
          ))}
        </ul>
        <ul className="dvd-index-links" aria-label="Elsewhere">
          <li>
            <a href={`mailto:${site.email}`}>Email</a>
          </li>
          {site.links
            .filter((l) => l.kind !== 'mail')
            .map((l) => (
              <li key={l.label}>
                <a href={l.kind === 'asset' ? asset(l.href) : l.href} target="_blank" rel="noreferrer">
                  {l.label} <span aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
        </ul>
      </div>
      <Globe className="dvd-index-mark" />
    </div>
  )
}

/* ---- 6. Column ---- */

type Bloom = { x: number; y: number; r: number; to: number }
type Speck = { id: number; x: number; y: number; size: number; color: string; delay: number }

const NEONS = SECTIONS.map((s) => s.color)

/**
 * Click-to-grow: each click opens a soft round hole in the paper that grows
 * to show the scene beneath, with a spray of neon specks, after the bloom on
 * franceszhao.ca. The holes are one mask on the scene, redrawn while they grow.
 */
function useBlooms() {
  const sceneRef = useRef<HTMLDivElement>(null)
  const blooms = useRef<Bloom[]>([])
  const frame = useRef(0)
  const [specks, setSpecks] = useState<Speck[]>([])

  const paint = useCallback(() => {
    const scene = sceneRef.current
    if (!scene) return
    const mask = blooms.current.length
      ? blooms.current
          .map((b) => `radial-gradient(circle at ${b.x}px ${b.y}px, #000 0, #000 ${b.r * 0.45}px, rgb(0 0 0 / 0.55) ${b.r * 0.72}px, transparent ${b.r}px)`)
          .join(', ')
      : 'linear-gradient(transparent, transparent)'
    scene.style.maskImage = mask
    scene.style.webkitMaskImage = mask
  }, [])

  const grow = useCallback(
    (x: number, y: number, to: number) => {
      const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      blooms.current = [...blooms.current, { x, y, r: still ? to : 0, to }]
      const spray = Array.from({ length: 26 }, () => {
        const angle = Math.random() * Math.PI * 2
        const dist = to * (0.25 + Math.random() * 0.95)
        return {
          id: Math.random(),
          x: x + Math.cos(angle) * dist,
          y: y + Math.sin(angle) * dist,
          size: 4 + Math.random() * 12,
          color: NEONS[Math.floor(Math.random() * NEONS.length)],
          delay: Math.random() * 700,
        }
      })
      setSpecks((all) => [...all, ...spray])
      if (still) return paint()
      if (frame.current) return

      // Each bloom eases toward its size; the loop stops once they all arrive.
      const tick = () => {
        blooms.current = blooms.current.map((b) => ({ ...b, r: b.to - b.r > 0.5 ? b.r + (b.to - b.r) * 0.05 : b.to }))
        paint()
        frame.current = blooms.current.some((b) => b.r < b.to) ? requestAnimationFrame(tick) : 0
      }
      frame.current = requestAnimationFrame(tick)
    },
    [paint],
  )

  const clear = useCallback(() => {
    blooms.current = []
    setSpecks([])
    paint()
  }, [paint])

  // Zero the frame on cleanup too, or a remount (Strict Mode does one) thinks a loop is still running.
  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current)
      frame.current = 0
    },
    [],
  )

  return { sceneRef, specks, grow, clear }
}

/**
 * After franceszhao.ca: a quiet column on white with the mark, the name, the
 * bio and the sections as folds (Works open). The rest of the page is empty
 * until you click it, and the scene grows through where you do. A neon tick
 * slides beside whichever fold you're on; each fold ends in a play button that
 * cuts into its section, the one DVD move in this layout.
 */
export function Column({ items, initial, backdrop, onSelect }: LayoutProps) {
  const folds = SECTIONS.filter((s) => s.id !== 'about')
  const start = Math.max(0, folds.findIndex((s) => s.id === SECTIONS[initial].id))
  const { active, setActive, listProps, highlightRef } = useMenu(folds.length, 'vertical', 1, start)
  const [open, setOpen] = useState<SectionId | null>('work')
  const { sceneRef, specks, grow, clear } = useBlooms()
  const rootRef = useRef<HTMLDivElement>(null)
  const role = site.experience[0]

  // The first bloom grows in the lower-right corner, as on Frances's site.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const { width, height } = root.getBoundingClientRect()
    grow(width * 0.94, height * 0.92, Math.max(width, height) * 0.3)
  }, [grow])

  const onSpace = (event: React.MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('.dvd-col, .dvd-col-hint, a, button')) return
    const rect = event.currentTarget.getBoundingClientRect()
    grow(event.clientX - rect.left, event.clientY - rect.top, 120 + Math.random() * 160)
  }

  return (
    <div ref={rootRef} className="dvd-layout dvd-column" style={tint(folds[active])} onClick={onSpace}>
      <Backdrop ref={sceneRef} kind={backdrop} className="dvd-column-scene" />
      <div className="dvd-speck-layer" aria-hidden="true">
        {specks.map((s) => (
          <span
            key={s.id}
            className="dvd-speck"
            style={{ left: s.x, top: s.y, '--size': `${s.size}px`, '--c': s.color, '--delay': `${s.delay}ms` } as React.CSSProperties}
          />
        ))}
      </div>

      <section className="dvd-col" aria-label="Portfolio">
        <Globe className="dvd-col-mark" />
        <h1 className="dvd-col-name">{site.name}</h1>
        <p className="dvd-col-bio">{site.bio}</p>
        <p className="dvd-col-bio">
          Currently {role.role}, {role.org}.
        </p>
        <div className="dvd-col-folds" {...listProps}>
          <span ref={highlightRef} className="dvd-hl dvd-hl-tick" aria-hidden="true" />
          {folds.map((s, i) => {
            const expanded = open === s.id
            return (
              <div key={s.id} className="dvd-fold">
                <button
                  type="button"
                  className="dvd-fold-head"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? null : s.id)}
                  {...itemProps(i, active, setActive)}
                >
                  <span>{s.id === 'work' ? 'Works' : s.label}</span>
                  <span className="dvd-fold-mark" aria-hidden="true" />
                </button>
                {expanded && (
                  <div className="dvd-fold-body">
                    {s.id === 'work' &&
                      items.map((item) => (
                        <Link key={item.meta.slug} href={`/work/${item.meta.slug}`}>
                          {item.meta.title}
                        </Link>
                      ))}
                    {s.id === 'experience' &&
                      site.experience.map((r) => (
                        <p key={r.role}>
                          {r.role}, {r.org} <span className="dvd-section-muted">· {r.when}</span>
                        </p>
                      ))}
                    {s.id === 'contact' && (
                      <>
                        <a href={`mailto:${site.email}`}>{site.email}</a>
                        {site.links
                          .filter((l) => l.kind !== 'mail')
                          .map((l) => (
                            <a key={l.label} href={l.kind === 'asset' ? asset(l.href) : l.href} target="_blank" rel="noreferrer">
                              {l.label} ↗
                            </a>
                          ))}
                      </>
                    )}
                    <button type="button" className="dvd-fold-play" onClick={() => onSelect(s.id)}>
                      ▶ {s.disc}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <p className="dvd-col-hint">
        <button type="button" onClick={clear} aria-label="Clear the space">
          ↺
        </button>
        <span className="dvd-col-dots" aria-hidden="true">
          {NEONS.slice(0, 3).map((c) => (
            <span key={c} style={{ background: c }} />
          ))}
        </span>
        (Click the space to grow)
      </p>
      <LiveClock className="dvd-col-clock" />
    </div>
  )
}

/* ---- 7. Split ---- */

type View = { kind: 'scene' } | { kind: 'section'; id: SectionId } | { kind: 'project'; slug: string }

function ProjectThumb({ item, i }: { item: WorkItem; i: number }) {
  return (
    <span className="dvd-chapter-thumb" style={{ '--c': placeholder(i).fill } as React.CSSProperties}>
      {item.cover ? (
        <Image src={item.cover.src} alt="" fill sizes="(min-width: 720px) 28vw, 90vw" className="dvd-chapter-img" />
      ) : (
        <span className="dvd-chapter-field" />
      )}
    </span>
  )
}

/** Featured Work in the pane: the projects as a scene-selection screen. */
function ProjectGrid({ items, onOpen }: { items: WorkItem[]; onOpen: (slug: string) => void }) {
  const { active, setActive, listProps, highlightRef } = useMenu(items.length, 'grid', 2)

  return (
    <div className="dvd-split-page">
      <p className="dvd-section-disc">Scene Selection</p>
      <h2 className="dvd-split-title">Featured Work</h2>
      <nav aria-label="Projects" className="dvd-chapters-grid dvd-split-grid" {...listProps}>
        <span ref={highlightRef} className="dvd-hl dvd-hl-frame" aria-hidden="true" />
        {items.map((item, i) => (
          <button key={item.meta.slug} type="button" className="dvd-chapter" onClick={() => onOpen(item.meta.slug)} {...itemProps(i, active, setActive)}>
            <ProjectThumb item={item} i={i} />
            <span className="dvd-chapter-caption">
              <span className="dvd-chapter-num">{indexLabel(i)}</span>
              <span className="dvd-chapter-label">{item.meta.title}</span>
              <span className="dvd-chapter-disc">{item.meta.subtitle}</span>
            </span>
          </button>
        ))}
      </nav>
    </div>
  )
}

/** A case study in the pane, scrolling inside it. */
function Project({ item, body, onBack }: { item: WorkItem; body: React.ReactNode; onBack: () => void }) {
  const { meta, cover } = item
  return (
    <article className="dvd-split-page">
      <button type="button" className="dvd-split-back" onClick={onBack}>
        <span aria-hidden="true">◀</span> Scene selection
      </button>
      <p className="dvd-section-disc">
        {meta.subtitle} · {meta.year}
      </p>
      <h2 className="dvd-split-title">{meta.title}</h2>
      {cover ? (
        <Image
          src={cover.src}
          alt=""
          width={cover.width}
          height={cover.height}
          placeholder="blur"
          blurDataURL={cover.blurDataURL}
          sizes="(min-width: 720px) 60vw, 100vw"
          className="dvd-split-cover"
        />
      ) : null}
      <p className="dvd-split-headline">{meta.headline}</p>
      <div className="dvd-split-body">
        <MetaRail meta={meta} />
        <div className="min-w-0">{body}</div>
      </div>
    </article>
  )
}

/**
 * Index and Column together, as a two-column site: 40% for the wordmark and
 * the menu, 60% for a pane that plays the scene until you choose something.
 * The menu keeps Index's neon block and the pane its colour-shifting rim; a ▶
 * marks the section you're in, separate from the one you're pointing at, as
 * on a disc. Featured Work opens as scene selection and projects scroll in the
 * pane. Esc steps back up; the wordmark goes back to the scene.
 */
export function Split({ items, cases, initial, backdrop, wordmark }: LayoutProps) {
  const { active, setActive, listProps, highlightRef } = useMenu(SECTIONS.length, 'vertical', 1, initial)
  const [view, setView] = useState<View>({ kind: 'scene' })
  const [cutting, setCutting] = useState(false)
  const timer = useRef(0)
  const paneRef = useRef<HTMLDivElement>(null)
  const current = SECTIONS[active]
  const inside = view.kind === 'section' ? view.id : view.kind === 'project' ? 'work' : null
  const viewKey = view.kind === 'project' ? view.slug : view.kind === 'section' ? view.id : 'scene'

  // The pane dissolves between views, as the full screen does in the lab. On a
  // phone it sits under the menu, so it's brought into view first.
  const go = useCallback((next: View) => {
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (next.kind !== 'scene' && window.matchMedia('(max-width: 720px)').matches) {
      paneRef.current?.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' })
    }
    clearTimeout(timer.current)
    setCutting(true)
    timer.current = window.setTimeout(
      () => {
        setView(next)
        setCutting(false)
      },
      still ? 0 : CUT_MS,
    )
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  useEffect(() => {
    if (view.kind === 'scene') return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      go(view.kind === 'project' ? { kind: 'section', id: 'work' } : { kind: 'scene' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [view, go])

  const project = view.kind === 'project' ? items.find((item) => item.meta.slug === view.slug) : undefined

  return (
    <div className="dvd-layout dvd-split" style={tint(current)}>
      <aside className="dvd-split-nav">
        <button type="button" className="dvd-split-home" onClick={() => go({ kind: 'scene' })}>
          <Wordmark variant={wordmark} />
        </button>
        <p className="dvd-split-bio">{site.bio}</p>

        <nav aria-label="Main menu" className="dvd-index-menu dvd-split-menu" {...listProps}>
          <span ref={highlightRef} className="dvd-hl dvd-hl-mark" aria-hidden="true" />
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className="dvd-index-item dvd-split-item"
              aria-current={inside === s.id ? 'page' : undefined}
              onClick={() => go({ kind: 'section', id: s.id })}
              {...itemProps(i, active, setActive)}
            >
              <span className="dvd-split-tick" aria-hidden="true">
                ▶
              </span>
              {s.label}
            </button>
          ))}
        </nav>

        <ul className="dvd-split-work" aria-label="Work">
          {items.map((item) => (
            <li key={item.meta.slug}>
              <button
                type="button"
                aria-current={view.kind === 'project' && view.slug === item.meta.slug ? 'page' : undefined}
                onClick={() => go({ kind: 'project', slug: item.meta.slug })}
              >
                {item.meta.title}, {item.meta.year}
              </button>
            </li>
          ))}
        </ul>

        <footer className="dvd-split-foot">
          <LiveClock />
          <a href={`mailto:${site.email}`}>Email</a>
          {site.links
            .filter((l) => l.kind !== 'mail')
            .map((l) => (
              <a key={l.label} href={l.kind === 'asset' ? asset(l.href) : l.href} target="_blank" rel="noreferrer">
                {l.label} ↗
              </a>
            ))}
        </footer>
      </aside>

      <div ref={paneRef} className="dvd-split-pane">
        <div key={viewKey} className="dvd-split-view" data-kind={view.kind} data-cutting={cutting || undefined} data-lenis-prevent>
          {view.kind === 'scene' && (
            <>
              <Backdrop kind={backdrop} />
              <p className="dvd-index-now">▶ Select a chapter</p>
            </>
          )}
          {view.kind === 'section' && view.id === 'work' && <ProjectGrid items={items} onOpen={(slug) => go({ kind: 'project', slug })} />}
          {view.kind === 'section' && view.id !== 'work' && (
            <div className="dvd-split-page">
              <p className="dvd-section-disc">{SECTIONS.find((s) => s.id === view.id)!.disc}</p>
              <h2 className="dvd-split-title">{SECTIONS.find((s) => s.id === view.id)!.label}</h2>
              <SectionList id={view.id} items={items} />
            </div>
          )}
          {project && <Project item={project} body={cases[project.meta.slug]} onBack={() => go({ kind: 'section', id: 'work' })} />}
        </div>
      </div>
    </div>
  )
}

export const LAYOUTS = [
  { id: 'split', name: 'Split', Component: Split, paper: true, note: 'Index and Column together: wordmark and menu in 40%, a 60% pane that plays the scene until you pick something. Projects open and scroll in the pane; Esc steps back.' },
  { id: 'feature', name: 'Feature', Component: Feature, paper: false, note: 'The movie disc: logo up top, a stacked menu bottom left, and a neon block that slides behind the item you’re on and changes colour.' },
  { id: 'network', name: 'Network', Component: Network, paper: false, note: 'A broadcast ident: one big centred mark, the menu in a row under it, a gliding pill and scanlines.' },
  { id: 'xmb', name: 'Cross bar', Component: CrossBar, paper: false, note: 'The PS3 menu: a row of icons, the active one enlarged and glowing, its contents listed underneath as a preview.' },
  { id: 'chapters', name: 'Chapters', Component: Chapters, paper: false, note: 'Scene selection as the homepage: four numbered thumbnails in a 2×2 and a neon frame that slides between them.' },
  { id: 'index', name: 'Index', Component: Index, paper: true, note: 'After chiquach.com: the name huge and cropped, the scene in a rounded window off the right edge, small uppercase lists bottom left. The rim takes the colour of the item you’re on.' },
  { id: 'column', name: 'Column', Component: Column, paper: true, note: 'After franceszhao.ca: a quiet column with folds on white. Click the empty space and the scene grows through it. ▶ in a fold plays that section.' },
] as const

export type LayoutId = (typeof LAYOUTS)[number]['id']

/* ---- Inside a section (a stub for now) ---- */

/**
 * Where a menu item leads. Only enough to feel the transition and the way
 * back; the real pages, starting with Featured Work as a scene-selection
 * screen, come next.
 */
export function SectionScreen({ id, items, onBack }: { id: SectionId; items: WorkItem[]; onBack: () => void }) {
  const section = SECTIONS.find((s) => s.id === id)!

  return (
    <div className="dvd-layout dvd-section" style={tint(section)}>
      <button type="button" className="dvd-back" onClick={onBack} autoFocus>
        <span aria-hidden="true">◀</span> Main menu
      </button>
      <p className="dvd-section-disc">{section.disc}</p>
      <h1 className="dvd-section-title">{section.label}</h1>
      <SectionList id={id} items={items} />
      <p className="dvd-section-stub">Inner pages are stubs. Esc or ◀ Main menu goes back.</p>
    </div>
  )
}

/** What each section holds, shared by the full-screen stub and Split's pane. */
function SectionList({ id, items }: { id: SectionId; items: WorkItem[] }) {
  return (
    <ul className="dvd-section-list">
      {id === 'work' &&
        items.map((item, i) => (
          <li key={item.meta.slug}>
            <span className="dvd-section-num">Chapter {indexLabel(i)}</span> {item.meta.title}
            <span className="dvd-section-muted"> · {item.meta.subtitle}</span>
          </li>
        ))}
      {id === 'experience' &&
        site.experience.map((r) => (
          <li key={r.role}>
            {r.org} <span className="dvd-section-muted">· {r.role} · {r.when}</span>
          </li>
        ))}
      {id === 'about' && <li>{site.bio}</li>}
      {id === 'contact' && (
        <>
          <li>
            <a href={`mailto:${site.email}`}>{site.email}</a>
          </li>
          {site.links
            .filter((l) => l.kind !== 'mail')
            .map((l) => (
              <li key={l.label}>
                <a href={l.kind === 'asset' ? asset(l.href) : l.href} target="_blank" rel="noreferrer">
                  {l.label} ↗
                </a>
              </li>
            ))}
        </>
      )}
    </ul>
  )
}
