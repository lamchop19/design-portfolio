'use client'

import { useState } from 'react'

import { Led } from '@/components/brand/led-matrix'
import { NameHero } from '@/components/brand/name-hero'
import { WindowShade } from '@/components/layout/window-shade'
import { site } from '@/../content/site'

import { DOT_FACES, type DotFace } from './variants'
import './dots.css'

function Sample({ face, run }: { face: DotFace; run: number }) {
  if (face.kind === 'led') {
    return (
      <div className="dm-led-wrap" data-board={face.board || undefined}>
        <Led key={run} text={site.name} shape={face.shape} lamp={face.lamp} className="dm-led-name" />
        <Led key={`s${run}`} text="TN25 · GATE 01A" shape={face.shape} lamp={face.lamp} className="dm-led-small" />
      </div>
    )
  }
  return (
    <div className="dm-font">
      <NameHero key={run} name={site.name} stack="never" intro="quick" />
      <p className="dm-small" aria-hidden="true">
        TN25 · GATE 01A
      </p>
    </div>
  )
}

/**
 * Every dot-matrix candidate set as the wordmark at full width, with a small
 * line under it to judge legibility at label size. Fonts run through the
 * real split-flap wordmark, so they flip exactly as they would on the site.
 */
export function DotMatrix({ fontVariables }: { fontVariables: string }) {
  const [run, setRun] = useState(0)

  return (
    <div className={`dm-page ${fontVariables}`}>
      <header className="swiss-grid items-end gap-y-4 pt-6 pb-10">
        <div className="col-span-full grid gap-3 md:col-span-8">
          <p className="t-label text-ink-faint">Wordmark · dot-matrix candidates</p>
          <h1 className="font-display text-[clamp(2.25rem,6vw,4.75rem)] leading-[0.92] tracking-[-0.04em]">
            Lamps, not pixels
          </h1>
          <p className="max-w-[62ch] text-ink-muted">
            Heavier dots, tighter grids and real board lamps, all at the wordmark’s real size. Each sample has a small
            label under it so you can judge legibility at small sizes too.
          </p>
        </div>
        <div className="col-span-full flex flex-wrap items-center gap-4 md:col-span-4 md:justify-end">
          <button type="button" className="dm-replay t-label" onClick={() => setRun((r) => r + 1)}>
            Replay all ↺
          </button>
          <WindowShade inline />
        </div>
      </header>

      {DOT_FACES.map((face, i) => (
        <section
          key={face.id}
          className="dm-face swiss-grid"
          data-face={face.id}
          style={
            face.kind === 'font'
              ? ({ '--dm-family': face.family, '--dm-weight': face.weight, '--dm-axes': face.axes } as React.CSSProperties)
              : undefined
          }
          aria-labelledby={`dm-${face.id}`}
        >
          <div className="col-span-full grid content-start gap-2 md:col-span-3">
            <h2 id={`dm-${face.id}`} className="t-label">
              {String(i + 1).padStart(2, '0')} · {face.label}
            </h2>
            <p className="text-sm leading-relaxed text-ink-muted">{face.note}</p>
          </div>
          <div className="col-span-full min-w-0 md:col-span-9">
            <Sample face={face} run={run} />
          </div>
        </section>
      ))}
    </div>
  )
}
