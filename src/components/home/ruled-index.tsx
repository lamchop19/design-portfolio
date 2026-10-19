'use client'

import Link from 'next/link'
import { useState } from 'react'

import { NameHero } from '@/components/brand/name-hero'
import { WorkCover } from '@/components/home/work-cover'
import { GridOverlay } from '@/components/layout/grid-overlay'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { asset } from '@/lib/paths'
import type { WorkItem } from '@/lib/work-items'
import { site } from '@/../content/site'

import './ruled-index.css'

/** The page's sections, top to bottom, by element id: what a nav can jump to or track. */
export const INDEX_SECTIONS = [
  { id: 'info', label: 'Info' },
  { id: 'work', label: 'Work' },
  { id: 'experience', label: 'Experience' },
  { id: 'contact', label: 'Contact' },
] as const

export type IndexSection = (typeof INDEX_SECTIONS)[number]['id']

/**
 * The homepage as a ruled index: the work as a typeset list on hairlines, with
 * the row in focus showing its cover in one fixed cell beside the list. Every
 * block sits on the site's one grid (.swiss-grid: 12 columns, 4 on phones,
 * 8px baseline) and carries no section labels.
 *
 * `nav` replaces the strip across the top (see /prototypes/nav-styles).
 * `renderCover` replaces what the cover cell shows for the row in focus (see
 * /prototypes/bitmap).
 */
export function RuledIndex({
  items,
  nav,
  renderCover,
}: {
  items: WorkItem[]
  nav?: React.ReactNode
  renderCover?: (item: WorkItem, index: number) => React.ReactNode
}) {
  const [active, setActive] = useState(0)

  const all = items.map((item) => item.meta.year)
  const years = `${Math.min(...all)}–${Math.max(...all)}`

  return (
    <div className="ri">
      {nav ?? (
        <header className="ri-strip swiss-grid t-label items-center">
          <p className="col-span-2 md:col-span-6">
            New York<span className="md:hidden"> · {years}</span>
          </p>
          <p className="hidden md:col-span-4 md:block">{years}</p>
          <span className="col-span-2 flex justify-end">
            <ThemeToggle inline />
          </span>
        </header>
      )}

      <div className="flex flex-col gap-[calc(var(--baseline)*14)] pt-[calc(var(--baseline)*6)] pb-[calc(var(--baseline)*16)]">
        <section className="swiss-grid gap-y-4">
          <div className="ri-wordmark col-span-full">
            <NameHero name={site.name} />
          </div>
          <div id="info" className="ri-row col-span-full grid grid-cols-subgrid gap-y-2">
            <p className="col-span-full md:col-span-6">{site.headline}</p>
            <p className="col-span-full text-ink-muted md:col-span-5 md:col-start-8">{site.bio}</p>
          </div>
        </section>

        <section id="work" className="swiss-grid gap-y-6" aria-label="Work">
          <div className="ri-cover-cell col-span-full md:col-span-5 md:col-start-8 md:row-start-1">
            {renderCover ? (
              renderCover(items[active], active)
            ) : (
              <div className="ri-cover aspect-[3/2] md:aspect-[4/5]">
                <WorkCover item={items[active]} index={active} sizes="(min-width: 768px) 40vw, 100vw" />
              </div>
            )}
          </div>
          <ul className="col-span-full md:col-span-7 md:col-start-1 md:row-start-1">
            {items.map((item, i) => (
              <li key={item.meta.slug}>
                <Link
                  href={`/work/${item.meta.slug}`}
                  transitionTypes={['nav-forward']}
                  data-active={i === active || undefined}
                  onPointerEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  className="ri-link ri-row grid grid-cols-[1fr_auto] items-baseline gap-x-(--gutter) gap-y-1 md:grid-cols-[minmax(0,4fr)_minmax(0,2fr)_auto]"
                >
                  <span className="ri-title">{item.meta.title}</span>
                  <span className="t-label hidden text-ink-faint md:block">{item.meta.subtitle}</span>
                  <span className="t-label text-right">{item.meta.year}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section id="experience" className="swiss-grid" aria-label="Experience">
          <ul className="t-label col-span-full grid grid-cols-subgrid">
            {site.experience.map((role) => (
              <li key={role.role} className="ri-row col-span-full grid grid-cols-subgrid">
                <span className="col-span-2 md:col-span-4">{role.org}</span>
                <span className="col-span-2 md:col-span-6">{role.role}</span>
                <span className="col-span-full text-ink-faint md:col-span-2 md:text-right">{role.when}</span>
              </li>
            ))}
          </ul>
        </section>

        <section id="contact" className="swiss-grid" aria-label="Contact">
          <a
            href={`mailto:${site.email}`}
            className="ri-row ri-link col-span-full flex items-baseline justify-between gap-6"
          >
            <span className="ri-title break-all">{site.email}</span>
            <span className="t-label">↗</span>
          </a>
          <ul className="t-label col-span-full mt-4 flex flex-wrap gap-x-5 gap-y-1">
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
        </section>
      </div>

      <GridOverlay />
    </div>
  )
}
