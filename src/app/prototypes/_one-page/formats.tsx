'use client'

import Link from 'next/link'
import { useState } from 'react'

import { WorkCover } from '@/components/home/work-cover'
import { Flora } from '@/components/flora/flora'
import { asset } from '@/lib/paths'
import type { WorkItem } from '@/lib/work-items'
import { site } from '@/../content/site'

/*
 * Four ways to fit the whole portfolio on one screen: work, bio, experience
 * and contact, with no scrolling from tablet width up (phones stack and
 * scroll). All static. Flora only ever sits in cells of its own, never
 * behind text. Styles in one-page.css.
 */

/** `picks` are the plants to use, in running order: each project gets its own. */
export type FormatProps = { items: WorkItem[]; picks: readonly string[] }

/** The i-th plant, wrapping round. */
const floraFor = (picks: readonly string[], i: number) => picks[i % picks.length]

const years = (items: WorkItem[]) => {
  const all = items.map((item) => item.meta.year)
  return `${Math.min(...all)}–${Math.max(...all)}`
}

/** Which project is pointed at or focused, for the formats that swap in its cover. */
function useActive(initial: number | null = null) {
  const [active, setActive] = useState<number | null>(initial)
  const bind = (i: number) => ({
    onPointerEnter: () => setActive(i),
    onPointerLeave: () => setActive(initial),
    onFocus: () => setActive(i),
    onBlur: () => setActive(initial),
  })
  return [active, bind] as const
}

function Links({ className }: { className?: string }) {
  return (
    <ul className={['op-links t-label', className].filter(Boolean).join(' ')}>
      {site.links.map((link) => (
        <li key={link.label}>
          <a
            href={link.kind === 'asset' ? asset(link.href) : link.href}
            {...(link.kind === 'external' ? { target: '_blank', rel: 'noreferrer' } : {})}
          >
            {link.label} ↗
          </a>
        </li>
      ))}
    </ul>
  )
}

function Email({ className }: { className?: string }) {
  return (
    <a href={`mailto:${site.email}`} className={['op-email', className].filter(Boolean).join(' ')}>
      {site.email}
    </a>
  )
}

function Experience({ className }: { className?: string }) {
  return (
    <ul className={['op-roles', className].filter(Boolean).join(' ')}>
      {site.experience.map((role) => (
        <li key={role.role} className="op-role">
          <span className="op-role-org">{role.org}</span>
          <span className="op-role-title">{role.role}</span>
          <span className="op-role-when t-label">{role.when}</span>
        </li>
      ))}
    </ul>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={['op-label t-label', className].filter(Boolean).join(' ')}>{children}</p>
}

/* ---- 1. Index sheet ---- */

/**
 * After Locomotive's and Nite Riot's indexes: the name across the top, three
 * columns of text (about and contact, work, experience) and a strip of plants
 * standing along the bottom, ending in a cell that shows the project in focus.
 */
export function IndexSheet({ items, picks }: FormatProps) {
  const [active, bind] = useActive(0)
  const shown = active ?? 0

  return (
    <div className="op op-index">
      <h1 className="op-name op-index-name">{site.name}</h1>

      <div className="op-grid op-fit op-index-main">
        <section className="op-index-about" aria-label="About">
          <Label>About · New York</Label>
          <p className="op-lede">{site.headline}</p>
          <p className="op-body">{site.bio}</p>
          <div className="op-index-contact">
            <Label>Contact</Label>
            <Email />
            <Links />
          </div>
        </section>

        <section className="op-index-work" aria-label="Work">
          <Label>
            Work · {items.length} projects · {years(items)}
          </Label>
          <ul>
            {items.map((item, i) => (
              <li key={item.meta.slug}>
                <Link href={`/work/${item.meta.slug}`} className="op-row" data-active={i === shown || undefined} {...bind(i)}>
                  <span className="op-title">{item.meta.title}</span>
                  <span className="op-row-meta t-label">
                    <span>{item.meta.subtitle}</span>
                    <span>{item.meta.year}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="op-index-roles" aria-label="Experience">
          <Label>Experience</Label>
          <Experience />
        </section>
      </div>

      <div className="op-grid op-index-band">
        <div className="op-index-flora">
          {items.map((item, i) => (
            <Flora key={item.meta.slug} id={floraFor(picks, i)} />
          ))}
          <Flora id={floraFor(picks, items.length)} />
          <Flora id={floraFor(picks, items.length + 1)} className="op-wide-only" />
        </div>
        <div className="op-index-cover">
          <WorkCover item={items[shown]} index={shown} sizes="25vw" morph={false} />
        </div>
      </div>
    </div>
  )
}

/* ---- 2. Specimen plate ---- */

/**
 * After the Saville-Kent plates and the tiled plant sheets: a grid of equal
 * tiles on hairlines. Each project is a figure, its plant above a caption;
 * pointing at one swaps in its cover. The name, about, experience and contact
 * fill the other tiles, and a plate line runs underneath.
 */
export function SpecimenPlate({ items, picks }: FormatProps) {
  const [active, bind] = useActive()

  const figure = (i: number) => {
    const item = items[i]
    if (!item) return null
    return (
      <Link key={item.meta.slug} href={`/work/${item.meta.slug}`} className="op-tile op-figure" data-active={i === active || undefined} {...bind(i)}>
        <span className="op-figure-art">
          <Flora id={floraFor(picks, i)} />
          <span className="op-figure-cover">
            <WorkCover item={item} index={i} sizes="25vw" morph={false} />
          </span>
        </span>
        <span className="op-figure-caption">
          <span className="t-label">Fig. {i + 1}</span>
          <span className="op-title">{item.meta.title}</span>
          <span className="t-label op-muted">
            {item.meta.subtitle} · {item.meta.year}
          </span>
        </span>
      </Link>
    )
  }

  return (
    <div className="op op-plate">
      <div className="op-plate-grid op-fit">
        <div className="op-tile op-plate-name">
          <Label>{site.headline}</Label>
          <h1 className="op-name">{site.name}</h1>
        </div>
        {figure(0)}
        {figure(1)}
        <div className="op-tile op-plate-text">
          <Label>About</Label>
          <p className="op-body">{site.bio}</p>
        </div>
        {figure(2)}
        {figure(3)}
        <div className="op-tile op-plate-text op-plate-roles">
          <Label>Experience</Label>
          <Experience />
          <span className="op-plate-roles-flora">
            <Flora id={floraFor(picks, 5)} />
          </span>
        </div>
        <div className="op-tile op-plate-flora">
          <Flora id={floraFor(picks, 4)} />
        </div>
        <div className="op-tile op-plate-contact">
          <Label>Contact · New York</Label>
          <Email />
          <Links />
        </div>
      </div>
      <p className="op-plate-line t-label">
        Pl. I — {site.name}. {site.headline}. New York, {years(items)}.
      </p>
    </div>
  )
}

/* ---- 3. Magazine cover ---- */

/**
 * After the 1980 遊 cover: the name as a masthead with an issue line, a
 * cluster of plants as the cover art, the work as a contents column on the
 * left and the roles as contributors on the right; about and contact along
 * the foot.
 */
export function MagazineCover({ items, picks }: FormatProps) {
  return (
    <div className="op op-cover op-grid">
      <div className="op-cover-issue">
        <Label>Portfolio · No. 01</Label>
        <Label>New York · {years(items)}</Label>
        <Label className="op-muted">{site.headline}</Label>
      </div>
      <h1 className="op-name op-cover-name">{site.name}</h1>

      <section className="op-cover-contents" aria-label="Work">
        <Label>Contents</Label>
        <ol>
          {items.map((item, i) => (
            <li key={item.meta.slug}>
              <Link href={`/work/${item.meta.slug}`} className="op-row">
                <span className="op-cover-page t-label">{String((i + 1) * 12).padStart(3, '0')}</span>
                <span className="op-title">{item.meta.title}</span>
                <span className="t-label op-muted">
                  {item.meta.subtitle} · {item.meta.year}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <div className="op-cover-art">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Flora key={i} id={floraFor(picks, i + 2)} flip={i % 2 === 1} />
        ))}
      </div>

      <section className="op-cover-roles" aria-label="Experience">
        <Label>Contributors</Label>
        <Experience />
      </section>

      <p className="op-body op-cover-bio">{site.bio}</p>
      <div className="op-cover-contact">
        <Email />
        <Links />
      </div>
    </div>
  )
}

/* ---- 4. Split ---- */

/**
 * Type on the left, work on the right: name, about, experience and contact
 * set down one half; the four projects as tiles in the other, each a plant
 * until pointed at, when its cover shows.
 */
export function Split({ items, picks }: FormatProps) {
  const [active, bind] = useActive()

  return (
    <div className="op op-split op-grid">
      <div className="op-split-type">
        <div>
          <h1 className="op-name op-split-name">{site.name}</h1>
          <p className="op-lede">{site.headline}</p>
        </div>
        <p className="op-body">{site.bio}</p>
        <div>
          <Label>Experience</Label>
          <Experience />
        </div>
        <div>
          <Label>Contact · New York</Label>
          <Email />
          <Links />
        </div>
      </div>

      <div className="op-split-work">
        {items.slice(0, 4).map((item, i) => (
          <Link key={item.meta.slug} href={`/work/${item.meta.slug}`} className="op-tile op-figure" data-active={i === active || undefined} {...bind(i)}>
            <span className="op-figure-art">
              <Flora id={floraFor(picks, i)} />
              <span className="op-figure-cover">
                <WorkCover item={item} index={i} sizes="25vw" morph={false} />
              </span>
            </span>
            <span className="op-figure-caption">
              <span className="op-title">{item.meta.title}</span>
              <span className="t-label op-muted">
                {item.meta.subtitle} · {item.meta.year}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export const FORMATS = [
  { id: 'index', name: '1 · Index sheet', note: 'Name across the top; about, work and experience in three columns; a strip of plants along the bottom ending in the focused project’s cover.', Component: IndexSheet },
  { id: 'plate', name: '2 · Specimen plate', note: 'A plate of equal tiles on hairlines: each project a figure with its plant and caption, the rest as text tiles, a plate line underneath. Point at a figure for its cover.', Component: SpecimenPlate },
  { id: 'cover', name: '3 · Magazine cover', note: 'After the 遊 cover: masthead name, a cluster of plants as cover art, work as contents on the left, roles as contributors on the right.', Component: MagazineCover },
  { id: 'split', name: '4 · Split', note: 'Type down the left half, the four projects as plant tiles on the right; point at one for its cover.', Component: Split },
] as const

export type FormatId = (typeof FORMATS)[number]['id']
