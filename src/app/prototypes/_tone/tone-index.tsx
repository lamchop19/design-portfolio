'use client'

import Link from 'next/link'
import { useState } from 'react'

import { WindowShade } from '@/components/layout/window-shade'
import type { WorkMeta } from '@/lib/content'
import { flightCode } from '@/lib/work-items'

import { toneFor } from './palette'

/**
 * The work list as one big type stack. Pointing at or focusing a row floods
 * the whole page in that project's colour, a preview of the takeover waiting
 * behind the link.
 */
export function ToneIndex({ work }: { work: WorkMeta[] }) {
  const [active, setActive] = useState<number | null>(null)
  const tone = active === null ? null : toneFor(work[active].slug, active)

  const style = tone
    ? ({ '--flood': tone.hero, '--flood-ink': tone.heroInk } as React.CSSProperties)
    : undefined

  return (
    <div className="tt-index px-(--page-margin) pt-5 pb-24" style={style}>
      <header className="t-label tt-row-meta flex flex-wrap justify-between gap-x-6 gap-y-2">
        <span>Marc Andre Lam · Departures</span>
        <span className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <span>{tone ? 'Now boarding' : 'Point at a flight'}</span>
          <span className="tt-shade">
            <WindowShade inline />
          </span>
        </span>
      </header>

      <ol className="mt-[14vh]" onPointerLeave={() => setActive(null)}>
        {work.map((meta, i) => (
          <li key={meta.slug} className="tt-rule border-t first:border-t-2">
            <Link
              href={`/prototypes/tone-on-tone/${meta.slug}`}
              onPointerEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-6 gap-y-2 py-4 md:py-6"
            >
              <span className="tt-row-title">{meta.title}</span>
              <span className="t-label tt-row-meta text-right">
                {flightCode(meta)}
                <br />
                {meta.subtitle} · {meta.year}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}
