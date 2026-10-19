'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { LiveClock } from '@/components/brand/live-clock'
import { INDEX_SECTIONS, type IndexSection } from '@/components/home/ruled-index'
import { scrollToY } from '@/components/layout/smooth-scroll'
import { WindowShade } from '@/components/layout/window-shade'
import { asset } from '@/lib/paths'
import { site } from '@/../content/site'

/*
 * Four navs for the ruled-index homepage, each a drop-in for its top strip
 * (RuledIndex's `nav`). They share the page's sections (INDEX_SECTIONS, by
 * id), so every link is a plain #anchor that also works without JS; with JS
 * it scrolls there smoothly.
 */

/** A sticky nav's height, roughly, so jumps land clear of it. */
const JUMP_OFFSET = 88

/** Where each section's dot takes its colour from: the three routes, then the accent. */
const DOT: Record<IndexSection, string> = {
  info: 'var(--brand-blue)',
  work: 'var(--brand-pink)',
  experience: 'var(--brand-green)',
  contact: 'var(--accent)',
}

function jump(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
  const target = document.getElementById(id)
  if (!target) return
  event.preventDefault()
  scrollToY(target.getBoundingClientRect().top + window.scrollY - JUMP_OFFSET)
}

function toTop(event: React.MouseEvent<HTMLAnchorElement>) {
  event.preventDefault()
  scrollToY(0)
}

/** The section in view: the last whose top has passed `line`, a fraction of the way down the screen. */
function useSectionInView(line = 0.35) {
  const [active, setActive] = useState<IndexSection>(INDEX_SECTIONS[0].id)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const mark = window.innerHeight * line
      let current: IndexSection = INDEX_SECTIONS[0].id
      for (const { id } of INDEX_SECTIONS) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= mark) current = id
      }
      // At the foot of the page the last section is in view, however short it is.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        current = INDEX_SECTIONS[INDEX_SECTIONS.length - 1].id
      }
      setActive(current)
    }
    const onScroll = () => {
      frame ||= requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [line])

  return active
}

/** How far down the page, 0–100. */
function useScrollPercent() {
  const [percent, setPercent] = useState(0)
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const range = document.documentElement.scrollHeight - window.innerHeight
      setPercent(range > 0 ? Math.round((window.scrollY / range) * 100) : 0)
    }
    const onScroll = () => {
      frame ||= requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])
  return percent
}

/** True once the page's LED wordmark has scrolled out of view. */
function useWordmarkGone() {
  const [gone, setGone] = useState(false)
  useEffect(() => {
    const mark = document.querySelector('.ri-wordmark')
    if (!mark) return
    const observer = new IntersectionObserver(([entry]) => setGone(!entry.isIntersecting && entry.boundingClientRect.top < 0))
    observer.observe(mark)
    return () => observer.disconnect()
  }, [])
  return gone
}

function SectionLink({
  id,
  label,
  active,
  className,
  onPick,
  children,
}: {
  id: IndexSection
  label: string
  active?: boolean
  className?: string
  /** Runs before the jump, e.g. to close a menu. */
  onPick?: () => void
  children?: React.ReactNode
}) {
  return (
    <a
      href={`#${id}`}
      onClick={(event) => {
        onPick?.()
        jump(event, id)
      }}
      aria-current={active ? 'location' : undefined}
      className={className}
    >
      {children ?? label}
    </a>
  )
}

function ScrapsLink({ className }: { className?: string }) {
  return (
    <Link href="/scraps" transitionTypes={['nav-forward']} className={className}>
      Scraps
    </Link>
  )
}

/* -------------------------------------------------------------------------- */
/* A + B. Ruled strip: one sticky row of hairline cells on the grid. The name
      takes the first cell once the wordmark has scrolled away. */

export function RuledStrip() {
  const active = useSectionInView()
  const gone = useWordmarkGone()

  return (
    <header className="nv-strip swiss-grid t-label" data-drop style={{ '--i': 0 } as React.CSSProperties}>
      <a href="#top" onClick={toTop} className="nv-cell nv-strip-name col-span-2 md:col-span-3" data-shown={gone || undefined}>
        <span className="nv-strip-place">New York</span>
        <span className="nv-strip-mark">{site.name}</span>
      </a>
      <nav aria-label="Sections" className="nv-cell nv-strip-nav order-last col-span-full md:order-none md:col-span-5">
        <p className="nv-strip-line">
          {INDEX_SECTIONS.map((section) => (
            <span key={section.id}>
              <SectionLink {...section} active={section.id === active} className="nv-strip-link" />
              {', '}
            </span>
          ))}
          <ScrapsLink className="nv-strip-link" />
        </p>
      </nav>
      <div className="nv-cell nv-wide gap-2 md:col-span-2">
        <span className="nv-live" aria-hidden="true" />
        <LiveClock />
      </div>
      <div className="nv-cell nv-strip-shade col-span-2 flex justify-end">
        <WindowShade inline />
      </div>
    </header>
  )
}

/* -------------------------------------------------------------------------- */
/* C. Segmented pill: two capsules float over the page. */

export function SegmentedPill() {
  const active = useSectionInView()
  const percent = useScrollPercent()

  return (
    <>
      {/* Holds the wordmark below the capsules at the top of the page. */}
      <div className="nv-pill-spacer" aria-hidden="true" />
      <nav aria-label="Sections" className="nv-pill nv-pill-left t-label" data-drop style={{ '--i': 0 } as React.CSSProperties}>
        <a href="#top" onClick={toTop} className="nv-pill-mark" aria-label={`${site.name}, back to top`}>
          MAL
        </a>
        {INDEX_SECTIONS.map((section) => (
          <SectionLink
            key={section.id}
            {...section}
            active={section.id === active}
            className={`nv-pill-seg ${section.id === 'experience' ? 'nv-wide' : ''}`}
          />
        ))}
        <span className="nv-pill-meter nv-wide" aria-hidden="true">
          {String(percent).padStart(2, '0')}%
        </span>
      </nav>
      <div className="nv-pill nv-pill-right t-label" data-drop style={{ '--i': 0 } as React.CSSProperties}>
        <LiveClock className="hidden md:block" />
        <WindowShade inline />
      </div>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* D. Margin index: the sections stacked in the first columns of a sticky
      header, each with a route-coloured dot that lights while it's in view. */

export function MarginIndex() {
  const active = useSectionInView()

  return (
    <header className="nv-margin swiss-grid t-label" data-drop style={{ '--i': 0 } as React.CSSProperties}>
      <nav aria-label="Sections" className="col-span-full md:col-span-3">
        <ul className="nv-margin-list">
          {INDEX_SECTIONS.map((section) => (
            <li key={section.id}>
              <SectionLink {...section} active={section.id === active} className="nv-margin-link">
                <span className="nv-dot" style={{ '--dot': DOT[section.id] } as React.CSSProperties} aria-hidden="true" />
                {section.label}
              </SectionLink>
            </li>
          ))}
          <li>
            <Link href="/scraps" transitionTypes={['nav-forward']} className="nv-margin-link">
              <span className="nv-dot" style={{ '--dot': 'var(--ink-faint)' } as React.CSSProperties} aria-hidden="true" />
              Scraps ↗
            </Link>
          </li>
        </ul>
      </nav>
      <p className="hidden self-start text-ink-faint md:col-span-2 md:col-start-6 md:block">New York</p>
      <div className="hidden self-start md:col-span-2 md:block">
        <LiveClock />
      </div>
      <div className="nv-margin-shade col-span-full flex self-start md:col-span-3 md:col-start-10 md:justify-end">
        <WindowShade inline />
      </div>
    </header>
  )
}

/* -------------------------------------------------------------------------- */
/* E. Bottom bar + menu: a bar docked at the foot of the screen; Menu opens the
      whole site as a full-screen list on hairlines. A <dialog>, so focus stays
      inside while it's open and Esc closes it. */

export function BottomMenu() {
  const active = useSectionInView()
  const dialog = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)
  const current = INDEX_SECTIONS.find((section) => section.id === active)!

  const show = () => {
    dialog.current?.showModal()
    // Start on Close rather than whatever comes first (the shade).
    dialog.current?.querySelector<HTMLElement>('.nv-menu-close')?.focus()
    setOpen(true)
  }
  const close = () => dialog.current?.close()

  return (
    <>
      <div className="nv-bar t-label" data-drop style={{ '--i': 0 } as React.CSSProperties}>
        <button type="button" className="nv-bar-open" onClick={show} aria-haspopup="dialog" aria-expanded={open}>
          <span aria-hidden="true">↑</span> Menu
        </button>
        <span className="nv-bar-here" aria-live="polite">
          <span className="nv-dot" style={{ '--dot': DOT[active] } as React.CSSProperties} aria-hidden="true" />
          {current.label}
        </span>
      </div>

      <dialog ref={dialog} className="nv-menu" aria-label="Menu" onClose={() => setOpen(false)}>
        <div className="nv-menu-head swiss-grid t-label items-center">
          <LiveClock className="col-span-2 md:col-span-6" />
          <span className="col-span-2 flex items-center justify-end gap-6 md:col-span-6">
            <WindowShade inline />
            <button type="button" onClick={close} className="nv-menu-close">
              Close ✕
            </button>
          </span>
        </div>
        <nav aria-label="Site" className="swiss-grid">
          <ul className="col-span-full">
            <li>
              <a
                href="#top"
                onClick={(event) => {
                  close()
                  toTop(event)
                }}
                className="ri-row ri-link nv-menu-row"
              >
                <span className="ri-title">Index</span>
                <span className="t-label text-ink-faint">{site.name}</span>
              </a>
            </li>
            {INDEX_SECTIONS.map((section, i) => (
              <li key={section.id}>
                <SectionLink {...section} active={section.id === active} onPick={close} className="ri-row ri-link nv-menu-row">
                  <span className="ri-title">{section.label}</span>
                  <span className="t-label text-ink-faint">{String(i + 1).padStart(2, '0')}</span>
                </SectionLink>
              </li>
            ))}
            <li>
              <Link href="/scraps" transitionTypes={['nav-forward']} className="ri-row ri-link nv-menu-row" onClick={close}>
                <span className="ri-title">Scraps</span>
                <span className="t-label text-ink-faint">↗</span>
              </Link>
            </li>
          </ul>
          <ul className="nv-menu-links t-label col-span-full">
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
        </nav>
      </dialog>
    </>
  )
}
