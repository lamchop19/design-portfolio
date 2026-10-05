'use client'

import Link from 'next/link'
import { useState } from 'react'

import { NameHero } from '@/components/brand/name-hero'
import { FLAP_LAND_MS, FLAP_STEP_MS, flapEases, halfway, type FlapEase } from '@/lib/flap-motion'
import { site } from '@/../content/site'

import { Segmented } from './controls'
import { flips, motionFor, speeds, updateSettings, useSettings, type FlipChoice } from './settings'

type Visit = 'full' | 'quick'

const visits: Array<[Visit, string]> = [
  ['full', 'First visit'],
  ['quick', 'Return visit'],
]
const slowmos: Array<[number, string]> = [
  [1, 'Off'],
  [4, '4×'],
]

/**
 * The wordmark once per flip curve, stacked for comparison. Every curve except
 * the stock one is an ease-in over the leaf's whole fall; the stock timing
 * eases each half separately.
 */
export function FlipLab() {
  const settings = useSettings()
  const [speed, setSpeed] = useState(2)
  const [visit, setVisit] = useState<Visit>('full')
  const [slow, setSlow] = useState(1)
  const [runs, setRuns] = useState<Record<string, number>>({})
  const [all, setAll] = useState(0)

  const step = Math.round(FLAP_STEP_MS * speed * slow)
  const land = Math.round(FLAP_LAND_MS * speed * slow)

  return (
    <div className="pb-24">
      <header className="swiss-grid t-label sticky top-0 z-10 items-end gap-y-4 border-b border-rule bg-surface py-4">
        <div className="col-span-full flex flex-col gap-1.5 md:col-span-3">
          <Link href="/prototypes" className="text-ink-faint transition-colors hover:text-accent">
            ← Prototypes
          </Link>
          <span>Flip lab</span>
        </div>
        <div className="col-span-full flex flex-wrap items-end gap-x-8 gap-y-4 md:col-span-9">
          <Segmented
            label={`Duration · ${step} / ${land} ms`}
            options={speeds.map((s): [number, string] => [s, `${s}×`])}
            value={speed}
            onChange={setSpeed}
          />
          <Segmented label="Intro" options={visits} value={visit} onChange={setVisit} />
          <Segmented label="Slow motion" options={slowmos} value={slow} onChange={setSlow} />
          <button
            type="button"
            onClick={() => setAll(all + 1)}
            className="bg-ink px-2 py-0.5 text-surface transition-opacity hover:opacity-80"
          >
            Replay all ↺
          </button>
        </div>
      </header>

      <p className="swiss-grid mt-8 mb-4 text-ink-muted">
        <span className="col-span-full max-w-[64ch] md:col-span-6 md:col-start-4">
          Each curve accelerates through the leaf’s whole 180° fall: slow off the top, fastest as it hits the stop,
          then a small rebound on the last flip. Move the pointer across a wordmark to flick its tiles.
        </span>
      </p>

      <ol>
        {flips.map(([choice, label], i) => {
          const key = `${choice}-${speed}-${slow}-${visit}-${all}-${runs[choice] ?? 0}`
          const inUse = settings.flip === choice && settings.speed === speed
          return (
            <li key={choice} className="swiss-grid items-center gap-y-6 border-b border-rule py-10">
              <div className="t-label col-span-full flex flex-col gap-3 md:col-span-3">
                <p>
                  <span className="text-ink-faint">{String(i).padStart(2, '0')} </span>
                  {label}
                </p>
                <Curve choice={choice} />
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setRuns({ ...runs, [choice]: (runs[choice] ?? 0) + 1 })}
                    className="transition-colors hover:text-accent"
                  >
                    Replay ↺
                  </button>
                  <button
                    type="button"
                    aria-pressed={inUse}
                    onClick={() => updateSettings({ flip: choice, speed })}
                    className="px-1 text-ink-muted transition-colors hover:text-accent aria-pressed:bg-ink aria-pressed:text-surface"
                  >
                    {inUse ? 'In use in Flight' : 'Use in Flight'}
                  </button>
                </div>
              </div>
              <NameHero
                key={key}
                name={site.name}
                stack="never"
                motion={motionFor(choice, speed, slow)}
                intro={visit}
                className="col-span-full md:col-span-9"
              />
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/** The fall curve, with the moment the leaf passes vertical marked. */
function Curve({ choice }: { choice: FlipChoice }) {
  if (choice === 'stock') {
    return <p className="text-ink-faint">Bezier ease per half · 55 / 130 ms at 1×</p>
  }
  const { fn, formula } = flapEases[choice as FlapEase]
  const w = 120
  const h = 72
  const points = Array.from({ length: 41 }, (_, i) => {
    const t = i / 40
    return `${(t * w).toFixed(1)},${(h - fn(t) * h).toFixed(1)}`
  })
  const mid = halfway(fn)
  return (
    <div className="flex items-end gap-4">
      <svg viewBox={`-2 -2 ${w + 4} ${h + 4}`} width={w} height={h} className="overflow-visible text-ink" aria-hidden="true">
        <rect width={w} height={h} fill="none" stroke="var(--rule)" />
        <line x1={0} x2={w} y1={h / 2} y2={h / 2} stroke="var(--rule)" strokeDasharray="2 3" />
        <line x1={mid * w} x2={mid * w} y1={0} y2={h} stroke="var(--rule)" strokeDasharray="2 3" />
        <polyline points={points.join(' ')} fill="none" stroke="currentColor" strokeWidth={1.5} />
        <circle cx={mid * w} cy={h / 2} r={3} fill="var(--accent)" />
      </svg>
      <p className="text-ink-faint">
        {formula}
        <br />
        Vertical at {Math.round(mid * 100)}%
      </p>
    </div>
  )
}
