import Link from 'next/link'

import { flightCode } from '@/lib/work-items'
import { work } from '@/../content/work'

import { toneFor } from './palette'

/** Every project as a tab in its own takeover colour, so the next hue is always in view. */
export function ToneTabs({ current }: { current?: string }) {
  return (
    <nav aria-label="Projects" className="tt-tabs">
      {work.map((meta, i) => {
        const tone = toneFor(meta.slug, i)
        return (
          <Link
            key={meta.slug}
            href={`/prototypes/tone-on-tone/${meta.slug}`}
            aria-current={meta.slug === current ? 'page' : undefined}
            className="tt-tab"
            style={{ '--tab-hero': tone.hero, '--tab-ink': tone.heroInk } as React.CSSProperties}
          >
            <span className="t-label">
              {flightCode(meta)} · {meta.year}
            </span>
            <span className="tt-tab-title">{meta.title}</span>
          </Link>
        )
      })}
    </nav>
  )
}
