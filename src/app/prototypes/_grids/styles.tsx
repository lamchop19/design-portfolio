'use client'

import Link from 'next/link'

import { NameHero } from '@/components/brand/name-hero'
import { WorkCover } from '@/components/home/work-cover'
import { HangMargin as Margin } from '@/components/layout/hang-margin'
import { disciplines, disciplinesOf } from '@/lib/disciplines'
import { asset } from '@/lib/paths'
import type { WorkItem } from '@/lib/work-items'
import { site } from '@/../content/site'

/*
 * The same homepage content laid out four ways. Every style sits on the site's
 * one grid (.swiss-grid: 12 columns, 4 on phones, 8px baseline) and carries no
 * section labels: what the content is should be clear from the content.
 */

type Props = { items: WorkItem[] }

const href = (item: WorkItem) => `/work/${item.meta.slug}` as const

function years(items: WorkItem[]) {
  const all = items.map((item) => item.meta.year)
  return `${Math.min(...all)}–${Math.max(...all)}`
}

function Wordmark() {
  return <NameHero name={site.name} />
}

function Links({ className }: { className?: string }) {
  return (
    <ul className={['flex flex-wrap gap-x-5 gap-y-1', className].filter(Boolean).join(' ')}>
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
  )
}

function DisciplinePills({ item }: { item: WorkItem }) {
  return (
    <span className="flex flex-wrap gap-1">
      {disciplinesOf(item.meta).map((d) => (
        <span key={d} className="gs-pill t-label" style={{ background: disciplines[d].fill, color: disciplines[d].ink }}>
          {d}
        </span>
      ))}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* 1. Hanging margin: columns 1–3 hold only small facts; everything else
      starts at column 4, so the left edge of the content is one hard line. */

export function HangingMargin({ items }: Props) {
  return (
    <div className="flex flex-col gap-[calc(var(--baseline)*16)] pt-[calc(var(--baseline)*8)] pb-[calc(var(--baseline)*16)]">
      <section className="swiss-grid gap-y-3">
        <Margin>
          <p>New York</p>
          <p>{years(items)}</p>
        </Margin>
        <div className="col-span-full md:col-span-9">
          <Wordmark />
          <p className="gs-statement mt-[calc(var(--baseline)*5)] max-w-[22ch]">{site.headline}</p>
        </div>
      </section>

      <ul className="flex flex-col gap-[calc(var(--baseline)*12)]">
        {items.map((item, i) => (
          <li key={item.meta.slug} className="swiss-grid gap-y-3">
            <Margin>
              <p>{item.meta.year}</p>
              <p>{item.meta.subtitle}</p>
            </Margin>
            <Link
              href={href(item)}
              className={`gs-card col-span-full ${i % 2 ? 'md:col-span-6' : 'md:col-span-9'}`}
            >
              <div className="gs-cover aspect-[3/2]">
                <WorkCover item={item} index={i} morph={false} sizes="(min-width: 768px) 70vw, 100vw" />
              </div>
              <p className="gs-title mt-3">{item.meta.title}</p>
            </Link>
          </li>
        ))}
      </ul>

      <section className="swiss-grid gap-y-3">
        <Margin>
          <p>Hi, I’m Marc</p>
        </Margin>
        <p className="gs-statement col-span-full md:col-span-7">{site.bio}</p>
      </section>

      <section className="swiss-grid gap-y-3">
        <Margin />
        <ul className="t-label col-span-full grid grid-cols-subgrid md:col-span-9">
          {site.experience.map((role) => (
            <li key={role.role} className="col-span-full grid grid-cols-subgrid border-t border-rule py-3">
              <span className="col-span-2 md:col-span-3">{role.org}</span>
              <span className="col-span-2 md:col-span-4">{role.role}</span>
              <span className="col-span-full text-ink-faint md:col-span-2 md:text-right">{role.when}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="swiss-grid gap-y-3">
        <Margin>
          <p>Say hello</p>
        </Margin>
        <div className="col-span-full md:col-span-9">
          <a href={`mailto:${site.email}`} className="gs-statement break-all transition-colors hover:text-accent">
            {site.email}
          </a>
          <Links className="t-label mt-[calc(var(--baseline)*3)]" />
        </div>
      </section>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* 2. Ruled index: now the homepage, components/home/ruled-index.tsx. */

/* -------------------------------------------------------------------------- */
/* 3. Modular field: the grid made visible. Every block fills whole modules
      (three columns by 28 baselines) and hairlines run between them. */

function Cell({ className, children }: { className: string; children?: React.ReactNode }) {
  return <div className={`gs-cell ${className}`}>{children}</div>
}

export function ModularField({ items }: Props) {
  const spans = [
    'col-span-4 md:col-span-6 row-span-2',
    'col-span-2 md:col-span-3 row-span-2',
    'col-span-2 md:col-span-3 row-span-2',
    'col-span-4 md:col-span-6 row-span-2',
  ]

  return (
    <div className="pt-[calc(var(--baseline)*6)] pb-[calc(var(--baseline)*16)]">
      <div className="gs-field">
        <Cell className="gs-cell-wordmark col-span-4 md:col-span-12">
          <Wordmark />
        </Cell>
        <Cell className="col-span-4 md:col-span-6">
          <p className="gs-statement">{site.headline}</p>
        </Cell>
        <Cell className="col-span-2 md:col-span-3">
          <p className="text-ink-muted">{site.bio}</p>
        </Cell>
        <Cell className="t-label col-span-2 justify-between md:col-span-3">
          <p>New York</p>
          <p className="text-ink-faint">{years(items)}</p>
        </Cell>

        {items.map((item, i) => (
          <Link key={item.meta.slug} href={href(item)} className={`gs-cell gs-cell-work ${spans[i % spans.length]}`}>
            <div className="gs-cover min-h-0 flex-1">
              <WorkCover item={item} index={i} morph={false} sizes="(min-width: 768px) 50vw, 100vw" />
            </div>
            <div className="flex items-baseline justify-between gap-3 p-4">
              <span className="gs-title">{item.meta.title}</span>
              <span className="t-label text-ink-faint">{item.meta.year}</span>
            </div>
          </Link>
        ))}

        <Cell className="t-label col-span-4 md:col-span-6 row-span-2">
          <ul className="flex flex-col">
            {site.experience.map((role) => (
              <li key={role.role} className="grid grid-cols-[1fr_auto] gap-x-4 border-b border-rule py-2 last:border-0">
                <span>
                  {role.org}
                  <span className="block text-ink-faint">{role.role}</span>
                </span>
                <span className="text-ink-faint">{role.when}</span>
              </li>
            ))}
          </ul>
        </Cell>

        <Cell className="col-span-4 justify-end md:col-span-9">
          <a href={`mailto:${site.email}`} className="gs-statement break-all transition-colors hover:text-accent">
            {site.email}
          </a>
        </Cell>
        <Cell className="t-label col-span-4 justify-end md:col-span-3">
          <Links className="flex-col" />
        </Cell>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* 4. Staggered columns: covers at set sizes and column starts, dropped by
      whole baselines, captions flush left and ragged right. */

const stagger = [
  { place: 'col-span-full md:col-span-8 md:col-start-1', ratio: 'aspect-[16/10]' },
  { place: 'col-span-3 col-start-2 md:col-span-4 md:col-start-9 md:mt-[calc(var(--baseline)*24)]', ratio: 'aspect-[4/5]' },
  { place: 'col-span-3 md:col-span-5 md:col-start-3', ratio: 'aspect-[4/5]' },
  { place: 'col-span-full md:col-span-5 md:col-start-8 md:mt-[calc(var(--baseline)*16)]', ratio: 'aspect-[3/2]' },
]

export function Staggered({ items }: Props) {
  return (
    <div className="flex flex-col gap-[calc(var(--baseline)*20)] pt-[calc(var(--baseline)*8)] pb-[calc(var(--baseline)*16)]">
      <section className="swiss-grid gap-y-6">
        <div className="col-span-full">
          <Wordmark />
        </div>
        <p className="gs-statement col-span-full md:col-span-5 md:col-start-8">{site.headline}</p>
      </section>

      <ul className="swiss-grid items-start gap-y-[calc(var(--baseline)*10)]">
        {items.map((item, i) => {
          const { place, ratio } = stagger[i % stagger.length]
          return (
            <li key={item.meta.slug} className={place}>
              <Link href={href(item)} className="gs-card block">
                <div className={`gs-cover ${ratio}`}>
                  <WorkCover item={item} index={i} morph={false} sizes="(min-width: 768px) 60vw, 100vw" />
                </div>
                <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                  <p className="gs-title">{item.meta.title}</p>
                  <DisciplinePills item={item} />
                </div>
                <p className="t-label mt-1 text-ink-faint">
                  {item.meta.subtitle} · {item.meta.year}
                </p>
              </Link>
            </li>
          )
        })}
      </ul>

      <section className="swiss-grid gap-y-[calc(var(--baseline)*8)]">
        <p className="gs-statement col-span-full md:col-span-5 md:col-start-7">{site.bio}</p>
        <ul className="t-label col-span-full md:col-span-5 md:col-start-2">
          {site.experience.map((role) => (
            <li key={role.role} className="flex justify-between gap-4 border-t border-rule py-3">
              <span>
                {role.org} · {role.role}
              </span>
              <span className="text-ink-faint">{role.when}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="swiss-grid gap-y-4">
        <a
          href={`mailto:${site.email}`}
          className="gs-statement col-span-full break-all transition-colors hover:text-accent md:col-span-9 md:col-start-3"
        >
          {site.email}
        </a>
        <Links className="t-label col-span-full md:col-span-9 md:col-start-3" />
      </section>
    </div>
  )
}
