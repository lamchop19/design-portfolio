'use client'

import Link from 'next/link'

import { LiveClock } from '@/components/brand/live-clock'
import { PixelGrid } from '@/components/brand/pixel-grid'
import { WorkCover } from '@/components/home/work-cover'
import { Pictogram, SignArrow, type PictogramName } from '@/components/landing/sign-nav'
import { WindowShade } from '@/components/layout/window-shade'
import { flightCode, type WorkItem } from '@/lib/work-items'
import { site } from '@/../content/site'

import './layouts.css'

type Tone = 'ink' | 'blue' | 'teal' | 'pink'

/** One sign band: pictogram, destination, and an arrow pointing the way. */
function Sign({
  picto,
  tone,
  children,
  arrow = 'right',
  gate,
  as: Tag = 'div',
  id,
}: {
  picto: PictogramName
  tone: Tone
  children: React.ReactNode
  arrow?: 'right' | 'down' | 'none'
  gate?: string
  as?: 'div' | 'h2'
  id?: string
}) {
  return (
    <Tag id={id} className="ly-sign" data-tone={tone}>
      <span className="ly-sign-picto">
        <Pictogram name={picto} />
      </span>
      <span className="ly-sign-text">{children}</span>
      {gate ? <span className="ly-sign-gate">{gate}</span> : null}
      {arrow !== 'none' ? (
        <span className="ly-sign-arrow" data-dir={arrow}>
          <SignArrow dir="down" />
        </span>
      ) : null}
    </Tag>
  )
}

/**
 * The homepage as airport signage. Each section is a sign band on the grid
 * (pictogram, destination, arrow) and the work is a run of gates. A gate
 * opens out under its sign to show the flight, pushing the next one down
 * rather than covering it.
 */
export function Wayfinding({ items }: { items: WorkItem[] }) {
  return (
    <div className="ly-page ly-wf">
      <div className="ly-wf-top t-label">
        <LiveClock />
        <span className="text-ink-faint">Terminal MAL · Portfolio</span>
        <WindowShade inline />
      </div>

      <header className="ly-wf-hero">
        <div className="ly-sign ly-sign-hero" data-tone="ink">
          <span className="ly-sign-picto">
            <Pictogram name="plane" />
          </span>
          <h1 className="ly-wf-name">{site.name}</h1>
        </div>
        <div className="ly-wf-subsigns">
          {['Brand', 'Social', 'Content'].map((label) => (
            <a key={label} href="#gates" className="ly-sign ly-sign-small" data-tone="blue">
              <span className="ly-sign-text">{label}</span>
              <span className="ly-sign-arrow" data-dir="down">
                <SignArrow dir="down" />
              </span>
            </a>
          ))}
        </div>
        <p className="ly-wf-lede">{site.bio}</p>
      </header>

      <section aria-labelledby="gates">
        <Sign as="h2" id="gates" picto="suitcase" tone="ink" arrow="down" gate={`A1–A${items.length}`}>
          Gates · Selected work
        </Sign>
        <ol>
          {items.map((item, i) => (
            <li key={item.meta.slug}>
              <Link href={`/work/${item.meta.slug}`} className="ly-gate">
                <span className="ly-sign" data-tone="blue">
                  <span className="ly-sign-gate ly-sign-gate-lead">A{i + 1}</span>
                  <span className="ly-sign-text">
                    {item.meta.title}
                    <span className="ly-sign-sub">
                      {item.meta.subtitle} · {item.meta.year}
                    </span>
                  </span>
                  <span className="ly-sign-arrow" data-dir="right">
                    <SignArrow dir="down" />
                  </span>
                </span>
                <span className="ly-gate-detail">
                  <span className="ly-gate-detail-inner swiss-grid gap-y-4">
                    <span className="col-span-full aspect-video overflow-hidden md:col-span-5">
                      <WorkCover item={item} index={i} sizes="(min-width: 768px) 40vw, 100vw" morph={false} />
                    </span>
                    <span className="col-span-full grid content-start gap-3 md:col-span-6 md:col-start-7">
                      <span className="t-label text-ink-faint">
                        Flight {flightCode(item.meta)} · {item.meta.client}
                      </span>
                      <span className="font-display text-[clamp(1.5rem,3vw,2.5rem)] leading-[1.05] tracking-tight text-balance">
                        {item.meta.headline}
                      </span>
                      <span className="text-ink-muted">{item.meta.role}</span>
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="info" className="mt-16">
        <Sign as="h2" id="info" picto="info" tone="teal" arrow="none">
          Information
        </Sign>
        <div className="swiss-grid gap-y-6 py-12">
          <p className="col-span-full font-display text-[clamp(1.75rem,4vw,3rem)] leading-[1.05] tracking-tight text-balance md:col-span-7">
            {site.headline}
          </p>
          <p className="col-span-full max-w-[56ch] text-lg text-ink-muted md:col-span-5">
            Every gate here is a community: a student club, a startup showcase, a study-abroad cohort, a streetwear
            label. The work is building the identity those people gather around.
          </p>
        </div>
      </section>

      <section aria-labelledby="meet">
        <Sign as="h2" id="meet" picto="envelope" tone="pink" arrow="none">
          Meeting point
        </Sign>
        <div className="swiss-grid gap-y-3 py-12">
          <p className="t-label col-span-full text-ink-faint">Find Marc at</p>
          <p className="col-span-full font-display text-[clamp(1.5rem,4vw,3rem)] leading-none tracking-tight select-all">{site.email}</p>
          <ul className="col-span-full mt-4 flex flex-wrap gap-3">
            {site.links.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="ly-sign ly-sign-small" data-tone="ink">
                  <span className="ly-sign-text">{link.label}</span>
                  <span className="ly-sign-arrow" data-dir="right">
                    <SignArrow dir="down" />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <PixelGrid className="mt-8" />
    </div>
  )
}
