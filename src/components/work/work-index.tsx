import Image from 'next/image'
import Link from 'next/link'
import { ViewTransition } from 'react'

import type { WorkMeta } from '@/lib/content'
import type { ImageEntry } from '@/lib/images'

export type WorkIndexItem = {
  meta: WorkMeta
  cover: ImageEntry | null
}

/** Stand-in thumbnails for projects without cover art, cycled in running order. */
const placeholders = ['var(--brand-blue)', 'var(--brand-pink)', 'var(--brand-green)', '#10364b']

/**
 * The work grid: a thumbnail and its descriptors per project. A real cover
 * carries a shared view-transition name, so clicking through morphs it into the
 * case study hero. Every card is an ordinary link, complete without JS.
 */
export function WorkIndex({ items }: { items: WorkIndexItem[] }) {
  return (
    <ul className="grid gap-x-6 gap-y-14 md:grid-cols-2 md:gap-y-20">
      {items.map(({ meta, cover }, index) => (
        <li key={meta.slug} className="rise-in">
          <Link href={`/work/${meta.slug}`} transitionTypes={['nav-forward']} className="group block">
            <div className="aspect-[16/10] overflow-hidden bg-surface-raised">
              {cover ? (
                <ViewTransition name={`cover-${meta.slug}`} share="morph" default="none">
                  <Image
                    src={cover.src}
                    alt=""
                    width={cover.width}
                    height={cover.height}
                    placeholder="blur"
                    blurDataURL={cover.blurDataURL}
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="work-thumb size-full object-cover"
                  />
                </ViewTransition>
              ) : (
                <div
                  className="work-thumb size-full"
                  style={{ background: placeholders[index % placeholders.length] }}
                />
              )}
            </div>
            <div className="mt-5 flex items-baseline justify-between gap-4">
              <h3 className="font-display text-[clamp(1.5rem,2.6vw,2.25rem)] leading-none tracking-tight transition-colors group-hover:text-accent">
                {meta.title}
              </h3>
              <span className="font-mono text-xs text-ink-faint tabular-nums">{meta.year}</span>
            </div>
            <p className="mt-3 max-w-[44ch] text-ink-muted">{meta.headline}</p>
            <p className="mt-3 font-mono text-xs tracking-wide text-ink-faint uppercase">{meta.subtitle}</p>
          </Link>
        </li>
      ))}
    </ul>
  )
}
