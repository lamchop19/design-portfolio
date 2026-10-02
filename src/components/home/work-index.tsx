'use client'

import Link from 'next/link'
import { useState } from 'react'

import { WorkCover } from '@/components/home/work-cover'
import { FlapText, SplitFlap } from '@/components/split-flap/split-flap'
import { indexLabel, type WorkItem } from '@/lib/work-items'

const ROW_STAGGER_MS = 90

/** Preview caption lines. Each keeps one tile count across projects so it can flip between them. */
const captionFields = [
  { label: 'Client', value: (item: WorkItem) => item.meta.client },
  { label: 'Role', value: (item: WorkItem) => item.meta.role },
  { label: 'Timeline', value: (item: WorkItem) => item.meta.timeline },
  { label: 'Team', value: (item: WorkItem) => item.meta.team },
] as const

/**
 * Layout A's work index: a numbered table over eight columns, and a preview
 * pinned in the last four. Pointing at a row (or focusing it) selects that
 * project: its cover fades up and the caption flips over to its details. The
 * selection stays on the last row pointed at.
 */
export function WorkIndex({ items, morph = true }: { items: WorkItem[]; morph?: boolean }) {
  const [active, setActive] = useState(0)
  const selected = items[active]
  const count = String(items.length).padStart(2, '0')

  return (
    <div className="col-span-full grid grid-cols-subgrid">
      <ol className="col-span-full grid grid-cols-subgrid content-start md:col-span-8">
        <li
          aria-hidden="true"
          className="t-label col-span-full hidden grid-cols-subgrid border-b border-rule pb-2 text-ink-faint md:grid"
        >
          <span>No.</span>
          <span className="col-span-4">Project</span>
          <span className="col-span-2">Discipline</span>
          <span>Year</span>
        </li>
        {items.map((item, i) => (
          <li key={item.meta.slug} className="col-span-full grid grid-cols-subgrid">
            <Link
              href={`/work/${item.meta.slug}`}
              transitionTypes={['nav-forward']}
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              className="work-row col-span-full grid grid-cols-subgrid items-baseline border-b border-rule py-4 md:py-5"
            >
              <FlapText
                text={indexLabel(i)}
                className="t-label text-ink-faint"
                trigger="visible"
                intro="quick"
                delay={i * ROW_STAGGER_MS}
              />
              <span className="col-span-3 text-[22px] leading-6 font-medium tracking-[-0.02em] md:col-span-4 md:text-[32px] md:leading-10">
                {item.meta.title}
              </span>
              <span className="t-label col-span-3 col-start-2 mt-2 flex gap-4 text-ink-faint md:col-span-2 md:col-start-auto md:mt-0 md:text-current">
                <FlapText
                  text={item.meta.subtitle}
                  trigger="visible"
                  intro="quick"
                  ripple
                  delay={i * ROW_STAGGER_MS + 60}
                />
                <span className="md:hidden">{item.meta.year}</span>
              </span>
              <span className="t-label hidden justify-between md:flex">
                <FlapText text={String(item.meta.year)} trigger="visible" intro="quick" delay={i * ROW_STAGGER_MS + 120} />
                <SplitFlap text={i === active ? '→' : ' '} trigger="none" swap="quick" />
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <aside aria-label="Selected project" className="hidden md:col-span-4 md:col-start-9 md:block">
        <div className="sticky top-8">
          <div className="relative aspect-[4/5] overflow-hidden bg-surface-raised">
            {items.map((item, i) => (
              <div
                key={item.meta.slug}
                className="work-preview-image absolute inset-0"
                style={{ opacity: i === active ? 1 : 0 }}
                aria-hidden={i !== active}
              >
                <WorkCover item={item} index={i} sizes="33vw" morph={morph} />
              </div>
            ))}
          </div>
          <dl className="t-label mt-4 grid grid-cols-4 gap-x-(--gutter) gap-y-0">
            <div className="col-span-4 grid grid-cols-subgrid">
              <dt className="text-ink-faint">Project</dt>
              <dd className="col-span-3">
                <FlapText
                  text={`${indexLabel(active)}/${count} ${selected.meta.title}`}
                  length={captionLength(items, (item) => `00/00 ${item.meta.title}`)}
                  trigger="none"
                  swap="quick"
                />
              </dd>
            </div>
            {captionFields.map((field) => (
              <div key={field.label} className="col-span-4 grid grid-cols-subgrid">
                <dt className="text-ink-faint">{field.label}</dt>
                <dd className="col-span-3">
                  <FlapText
                    text={field.value(selected)}
                    length={captionLength(items, field.value)}
                    trigger="none"
                    swap="quick"
                  />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </aside>
    </div>
  )
}

function captionLength(items: WorkItem[], value: (item: WorkItem) => string) {
  return Math.max(...items.map((item) => value(item).length))
}
