'use client'

import Link from 'next/link'
import { useState } from 'react'

import { NameHero } from '@/components/brand/name-hero'
import { WorkCover } from '@/components/home/work-cover'
import { GridOverlay } from '@/components/layout/grid-overlay'
import { HangMargin } from '@/components/layout/hang-margin'
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
 * The homepage, one page from the surface down: the wordmark and headline,
 * the bio lit in as it is read, then the work as a typeset list on hairlines
 * (the row in focus shows its cover in one sticky cell beside it), the roles
 * and contact. Every block sits on the site's one grid (.swiss-grid: 12
 * columns, 4 on phones, 8px baseline): section indexes hang in columns 1–3,
 * everything else starts at column 4. The ocean wallpaper (components/ocean)
 * prints behind it, with the reef under Contact.
 *
 * `nav` adds a strip across the top (see /prototypes/nav-styles).
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
    <div id="top" className="ri">
      {nav}

      <div className="flex flex-col gap-[calc(var(--baseline)*16)] pt-[calc(var(--baseline)*13)] pb-[calc(var(--baseline)*40)] md:pb-[calc(var(--baseline)*64)]">
        <section className="swiss-grid gap-y-6">
          <div className="ri-wordmark col-span-full">
            <NameHero name={site.name} />
          </div>
          <div className="ri-row col-span-full grid grid-cols-subgrid gap-y-2">
            <HangMargin>
              <span>New York</span>
              <span>{years}</span>
            </HangMargin>
            <p className="ri-headline col-span-full md:col-span-9">{site.headline}</p>
          </div>
        </section>

        <section id="info" className="swiss-grid gap-y-4" aria-label="About">
          <SectionIndex n={1} label="About" />
          <p className="ri-bio col-span-full md:col-span-8">{site.bio}</p>
        </section>

        <section id="work" className="swiss-grid gap-y-6" aria-labelledby="work-title">
          <SectionIndex n={2} label={`${items.length} projects`} />
          <div className="col-span-full md:col-span-9">
            <h2 id="work-title" className="ri-section-title">
              Work
            </h2>
          </div>
          <ul className="col-span-full md:col-span-5 md:col-start-4">
            {items.map((item, i) => (
              <li key={item.meta.slug}>
                <Link
                  href={`/work/${item.meta.slug}`}
                  transitionTypes={['nav-forward']}
                  data-active={i === active || undefined}
                  onPointerEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  className="ri-link ri-row grid grid-cols-[1fr_auto] items-baseline gap-x-(--gutter) gap-y-1"
                >
                  <span className="ri-title">{item.meta.title}</span>
                  <span className="t-label text-right">{item.meta.year}</span>
                  <span className="t-label col-span-full text-ink-faint">{item.meta.subtitle}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="ri-cover-cell col-span-full md:col-span-4 md:col-start-9">
            {renderCover ? (
              renderCover(items[active], active)
            ) : (
              <div className="ri-cover aspect-[3/2] md:aspect-[4/5]">
                <WorkCover item={items[active]} index={active} sizes="(min-width: 768px) 33vw, 100vw" />
              </div>
            )}
          </div>
        </section>

        <section id="experience" className="swiss-grid gap-y-6" aria-labelledby="experience-title">
          <SectionIndex n={3} label="Roles" />
          <div className="col-span-full md:col-span-9">
            <h2 id="experience-title" className="ri-section-title">
              Experience
            </h2>
          </div>
          <ul className="t-label col-span-full grid grid-cols-subgrid md:col-span-9 md:col-start-4">
            {site.experience.map((role) => (
              <li key={role.role} className="ri-row col-span-full grid grid-cols-subgrid">
                <span className="col-span-2 md:col-span-3">{role.org}</span>
                <span className="col-span-2 md:col-span-4">{role.role}</span>
                <span className="col-span-full text-ink-faint md:col-span-2 md:text-right">{role.when}</span>
              </li>
            ))}
          </ul>
        </section>

        <section id="contact" className="swiss-grid gap-y-6" aria-labelledby="contact-title">
          <SectionIndex n={4} label="Say hello" />
          <div className="col-span-full md:col-span-9">
            <h2 id="contact-title" className="ri-section-title">
              Contact
            </h2>
          </div>
          <div className="col-span-full md:col-span-9 md:col-start-4">
            <a href={`mailto:${site.email}`} className="ri-row ri-link flex items-baseline justify-between gap-6">
              <span className="ri-title ri-email">{site.email}</span>
              <span className="t-label">↗</span>
            </a>
            <ul className="t-label mt-4 flex flex-wrap gap-x-5 gap-y-1">
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
          </div>
        </section>
      </div>

      <GridOverlay />
    </div>
  )
}

/** A section's index in the hanging margin: "002/ Work"-style, after Anima. */
function SectionIndex({ n, label }: { n: number; label: string }) {
  return (
    <HangMargin className="ri-index">
      <span className="text-ink">{String(n).padStart(3, '0')}/</span>
      <span>{label}</span>
    </HangMargin>
  )
}
