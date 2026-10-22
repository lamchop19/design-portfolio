'use client'

import { useState } from 'react'

import { itemProps, SECTIONS, useMenu } from '../_dvd/menu'

import { chapterNumber, clock, NEON_COUNT, type Chapter } from './chapters'

/*
 * The chapter control, three ways: where it sits is the whole difference.
 * Bar is a player's transport along the bottom of the screen, Rail lists the
 * chapters down the hanging margin beside the text, and Remote is a handset
 * in the corner with an LCD and a jog ring. All three read the same progress
 * (--f0, --f1… on the disc, see reading.ts) and seek through the same call.
 */

/** The DVD menu's neons, reordered pink, blue, green, yellow, so short discs never reach the yellow. */
const NEONS = [0, 3, 2, 1].map((i) => SECTIONS[i])

/** The four neons as custom properties, set once on the lab. */
export const NEON_VARS = Object.fromEntries(
  NEONS.flatMap((s, i) => [
    [`--neon-${i}`, s.color],
    [`--on-neon-${i}`, s.on],
  ]),
) as React.CSSProperties

/** Chapter i's neon (and the ink that reads on it) and its progress, for anything drawn per chapter. */
export const chapterVars = (i: number) =>
  ({ '--c': `var(--neon-${i % NEON_COUNT})`, '--on-c': `var(--on-neon-${i % NEON_COUNT})`, '--f': `var(--f${i}, 0)` }) as React.CSSProperties

/** The DVD menu section whose neon chapter i wears, for tint(). */
export const neonSection = (i: number) => NEONS[i % NEON_COUNT]

export type OsdId = 'bar' | 'rail' | 'remote'

export const OSDS: { id: OsdId; name: string; note: string }[] = [
  {
    id: 'bar',
    name: 'Bar',
    note: 'A player’s transport along the bottom: skip buttons, the chapter in dots, one segment per chapter sized by its runtime and filling as you read. Hover a segment for its chapter; click anywhere along it to seek.',
  },
  {
    id: 'rail',
    name: 'Rail',
    note: 'The chapters down the hanging margin, beside the text: each a bar as tall as its runtime, filling top to bottom, with ▶ on the one playing. On a phone it becomes a strip under the pills.',
  },
  {
    id: 'remote',
    name: 'Remote',
    note: 'A handset in the corner: an LCD with the chapter and time, a jog ring split into chapters, skip buttons and Menu. Point at the ring to preview a chapter on the LCD; click it to seek.',
  },
]

type OsdProps = {
  chapters: Chapter[]
  current: number
  elapsed: number
  total: number
  seek: (i: number, at?: number) => void
  /** Back to the scene selection, as a remote's Menu button does. */
  onMenu: () => void
}

/** The chapter number as the display prints it: dot-matrix, "CH" small. */
function Dots({ index, className }: { index: number; className?: string }) {
  return (
    <span className={['ch-dots', className].filter(Boolean).join(' ')}>
      <span className="ch-dots-ch">CH</span>
      {chapterNumber(index)}
    </span>
  )
}

/** Tells screen readers when the chapter changes, and nothing else: the clocks tick every second. */
function Announce({ index, title }: { index: number; title: string }) {
  return (
    <span className="sr-only" aria-live="polite">
      Chapter {chapterNumber(index)}, {title}
    </span>
  )
}

/* ---- Bar ---- */

export function BarOsd({ chapters, current, elapsed, total, seek, onMenu }: OsdProps) {
  const last = chapters.length - 1
  const chapter = chapters[current]

  return (
    <div className="ch-osd ch-bar" role="region" aria-label="Chapter controls" style={chapterVars(current)}>
      <div className="ch-bar-skip">
        <button type="button" className="ch-key" onClick={() => seek(Math.max(0, current - 1))} disabled={current === 0} aria-label="Previous chapter">
          <span aria-hidden="true">◀◀</span>
        </button>
        <button type="button" className="ch-key" onClick={() => seek(Math.min(last, current + 1))} disabled={current === last} aria-label="Next chapter">
          <span aria-hidden="true">▶▶</span>
        </button>
      </div>

      <p className="ch-bar-now">
        <Dots index={current} />
        <span className="ch-bar-title">{chapter.title}</span>
      </p>
      <Announce index={current} title={chapter.title} />

      <div className="ch-bar-track">
        {chapters.map((c, i) => (
          <button
            key={c.index}
            type="button"
            className="ch-seg"
            data-current={i === current || undefined}
            style={{ ...chapterVars(i), flexGrow: c.seconds }}
            aria-label={`Chapter ${chapterNumber(i)}, ${c.title}, ${clock(c.seconds)}`}
            onClick={(event) => {
              // A click seeks to that point in the chapter; Enter (no pointer position) lands on its start.
              const box = event.currentTarget.getBoundingClientRect()
              seek(i, event.detail ? (event.clientX - box.left) / box.width : 0)
            }}
          >
            <span className="ch-seg-fill" />
            {i === current && <span className="ch-seg-head" />}
            <span className="ch-seg-tip" aria-hidden="true">
              <Dots index={i} /> {c.title} · {clock(c.seconds)}
            </span>
          </button>
        ))}
      </div>

      <p className="ch-bar-time">
        <span className="ch-bar-elapsed">{clock(elapsed)}</span> / {clock(total)}
      </p>

      <button type="button" className="ch-key ch-bar-menu" onClick={onMenu}>
        Scenes
      </button>
    </div>
  )
}

/* ---- Rail ---- */

export function RailOsd({ chapters, current, elapsed, total, seek }: OsdProps) {
  const { active, setActive, listProps, highlightRef } = useMenu(chapters.length, 'vertical', 1, current)
  const chapter = chapters[current]

  return (
    <aside className="ch-rail" aria-label="Chapters" style={chapterVars(current)}>
      <Announce index={current} title={chapter.title} />
      <div className="ch-rail-now">
        <p className="t-label ch-rail-kicker">Now playing</p>
        <Dots index={current} className="ch-rail-dots" />
        <p className="ch-rail-title">{chapter.title}</p>
        <p className="t-label ch-rail-time">
          {clock(elapsed)} / {clock(total)}
        </p>
      </div>
      <nav className="ch-rail-list" aria-label="Chapter list" {...listProps}>
        <span ref={highlightRef} className="ch-hl ch-hl-mark" aria-hidden="true" />
        {chapters.map((c, i) => (
          <button
            key={c.index}
            type="button"
            className="ch-rail-item"
            style={{ ...chapterVars(i), '--runtime': c.seconds } as React.CSSProperties}
            aria-current={i === current ? 'step' : undefined}
            onClick={() => seek(i)}
            {...itemProps(i, active, setActive)}
          >
            <span className="ch-rail-seg" aria-hidden="true">
              <span />
            </span>
            <span className="ch-rail-tick" aria-hidden="true">
              ▶
            </span>
            <span className="ch-rail-num">{chapterNumber(i)}</span>
            <span className="ch-rail-label">{c.title}</span>
            <span className="ch-rail-dur">{clock(c.seconds)}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}

/* ---- Remote ---- */

const RING = { c: 60, r: 47, gap: 7 }

/** An arc of the jog ring, clockwise from `from` to `to` degrees, 0 at the top. */
function arc(from: number, to: number) {
  const point = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180
    return `${(RING.c + RING.r * Math.cos(rad)).toFixed(2)} ${(RING.c + RING.r * Math.sin(rad)).toFixed(2)}`
  }
  return `M ${point(from)} A ${RING.r} ${RING.r} 0 ${to - from > 180 ? 1 : 0} 1 ${point(to)}`
}

/** Which chapter, and how far into it, a point on the ring stands for. */
function onRing(chapters: Chapter[], total: number, deg: number) {
  let at = (deg / 360) * total
  for (const c of chapters) {
    if (at <= c.seconds) return { i: c.index, share: at / c.seconds }
    at -= c.seconds
  }
  return { i: chapters.length - 1, share: 1 }
}

export function RemoteOsd({ chapters, current, elapsed, total, seek, onMenu }: OsdProps) {
  const [peek, setPeek] = useState<number | null>(null)
  // Each press restarts the IR lamp's blink, by key.
  const [presses, setPresses] = useState(0)
  const shown = peek ?? current
  const last = chapters.length - 1

  // The ring split by runtime, each chapter an arc with a gap after it.
  const arcs = chapters.map((c, i) => {
    const from = (chapters.slice(0, i).reduce((sum, before) => sum + before.seconds, 0) / total) * 360
    return arc(from + RING.gap / 2, from + (c.seconds / total) * 360 - RING.gap / 2)
  })

  const press = (action: () => void) => () => {
    setPresses((n) => n + 1)
    action()
  }

  const angleOf = (event: React.MouseEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - (box.left + box.width / 2)
    const y = event.clientY - (box.top + box.height / 2)
    return ((Math.atan2(y, x) * 180) / Math.PI + 90 + 360) % 360
  }

  return (
    <div className="ch-osd ch-remote" role="region" aria-label="Chapter remote" style={chapterVars(shown)}>
      <span key={presses} className="ch-remote-ir" data-blink={presses > 0 || undefined} aria-hidden="true" />
      <p className="ch-remote-brand" aria-hidden="true">
        Chapter remote
      </p>

      <Announce index={current} title={chapters[current].title} />
      <div className="ch-lcd">
        <p className="ch-lcd-row">
          <Dots index={shown} />
          <span className="ch-lcd-time">{peek === null ? clock(elapsed) : clock(chapters[peek].seconds)}</span>
        </p>
        <p className="ch-lcd-title">{chapters[shown].title}</p>
      </div>

      <div className="ch-remote-pad">
        <button type="button" className="ch-key" onClick={press(() => seek(Math.max(0, current - 1)))} disabled={current === 0} aria-label="Previous chapter">
          <span aria-hidden="true">◀◀</span>
        </button>

        <div className="ch-ring-wrap">
          <svg
            viewBox="0 0 120 120"
            className="ch-ring"
            aria-hidden="true"
            onPointerMove={(event) => setPeek(onRing(chapters, total, angleOf(event)).i)}
            onPointerLeave={() => setPeek(null)}
            onClick={(event) => {
              const { i, share } = onRing(chapters, total, angleOf(event))
              setPresses((n) => n + 1)
              seek(i, share)
            }}
          >
            {arcs.map((d, i) => (
              <g key={i} style={chapterVars(i)} data-peek={peek === i || undefined}>
                <path d={d} className="ch-ring-track" />
                <path d={d} className="ch-ring-fill" pathLength={1} />
              </g>
            ))}
          </svg>
          <button type="button" className="ch-remote-menu" onClick={press(onMenu)}>
            Menu
          </button>
        </div>

        <button type="button" className="ch-key" onClick={press(() => seek(Math.min(last, current + 1)))} disabled={current === last} aria-label="Next chapter">
          <span aria-hidden="true">▶▶</span>
        </button>
      </div>
    </div>
  )
}
