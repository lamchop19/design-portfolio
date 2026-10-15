import { useId, type ReactNode } from 'react'

import { MARKS, type Bands, type Mark } from './marks'
import { TrackGroup } from './track'

/**
 * The compact Hollick marks painted on a tail fin, in four liveries taken from
 * airline tails: a badge, the lanes run out as stripes, the mark blown up and
 * cropped, and a fin split into two colour fields. Fins are paint, so their
 * colours stay put in dark mode.
 */

type Point = [number, number]

/** Fin silhouette in a 100 × 110 box: swept leading edge, short top, near-upright trailing edge. */
const FIN = 'M2 110L56 4Q58 0 62 0H88Q92 0 92.4 4L98 110Z'

/** Leading-edge angle from the horizontal, in degrees (63°; rounded so server and client render the same). */
export const SWEEP = Math.round((Math.atan2(106, 54) * 180) / Math.PI)

/** Angle the stripes climb at once they leave the mark: steep, so they reach the top before the trailing edge. */
const CLIMB = 82

/** Rounds trig output so server and client render identical coordinates. */
const r2 = (n: number) => Math.round(n * 100) / 100

const WHITE = '#ffffff'
const INK = '#0a0f1f'

/** The second field for split fins, keyed by the lab colour. */
const PAIRS: Record<string, string> = {
  '#0059ff': '#f551ab',
  '#f551ab': '#ff6720',
  '#ff6720': '#0059ff',
  [INK]: '#0059ff',
}

const FIN_MARK_IDS = ['mal-ligature', 'departing', 'terminus', 'roundel', 'm-arches'] as const
type FinMarkId = (typeof FIN_MARK_IDS)[number]

const FIN_MARKS = FIN_MARK_IDS.map((id) => MARKS.find((m) => m.id === id)!)

/** Scale a mark about its centre, place that centre at (cx, cy), optionally rotated. */
function place(mark: Mark, s: number, cx: number, cy: number, rotate = 0) {
  const [w, h] = mark.viewBox
  return `translate(${cx} ${cy}) rotate(${rotate}) scale(${s}) translate(${-w / 2} ${-h / 2})`
}

function along(from: Point, degrees: number, length: number): Point {
  const a = (degrees * Math.PI) / 180
  return [r2(from[0] + Math.cos(a) * length), r2(from[1] - Math.sin(a) * length)]
}

/**
 * The mark with its main route carried off the fin at both ends: a lead-in
 * from beyond the leading edge, and the baseline run-out turning up at
 * `turn` to climb out over the top. The lanes become the livery stripes.
 */
function withStripes(mark: Mark, turn: number | null): Mark {
  if (mark.id === 'roundel') {
    // No run-out to extend: the feet drop off the base, and a track climbs
    // past the ring on its trailing side.
    const [first, ...rest] = mark.routes
    const ring = mark.ring!
    const offset = ring.r + mark.width + 3
    const n = ((CLIMB - 90) * Math.PI) / 180
    const tangent: Point = [r2(ring.at[0] + Math.cos(n) * offset), r2(ring.at[1] - Math.sin(n) * offset)]
    return {
      ...mark,
      routes: [
        [[first[0][0], 400], ...first, [first.at(-1)![0], 400]],
        [along(tangent, CLIMB, -400), along(tangent, CLIMB, 400)],
        ...rest,
      ],
    }
  }

  const [main, ...rest] = mark.routes
  const start = main[0]
  const lead: Point = [start[0] - 400, start[1]]
  if (turn === null) return { ...mark, routes: [[lead, ...main], ...rest] }
  const corner: Point = [turn, main.at(-1)![1]]
  return { ...mark, routes: [[lead, ...main.slice(0, -1), corner, along(corner, CLIMB, 400)], ...rest] }
}

type Fit = { s: number; cx: number; cy: number }

/** Where each livery puts each mark. Crops especially are tuned by eye. */
const FITS: Record<'stripes' | 'crop', Record<FinMarkId, Fit & { turn?: number | null }>> = {
  stripes: {
    'mal-ligature': { s: 0.42, cx: 50, cy: 82, turn: 112 },
    departing: { s: 0.42, cx: 52, cy: 82, turn: null },
    terminus: { s: 0.38, cx: 48, cy: 84, turn: 128 },
    roundel: { s: 0.5, cx: 60, cy: 72 },
    'm-arches': { s: 0.44, cx: 48, cy: 84, turn: 108 },
  },
  crop: {
    'mal-ligature': { s: 1.05, cx: 66, cy: 64 },
    departing: { s: 1.1, cx: 50, cy: 66 },
    terminus: { s: 1.05, cx: 54, cy: 60 },
    roundel: { s: 1.5, cx: 74, cy: 70 },
    'm-arches': { s: 1.25, cx: 60, cy: 64 },
  },
}

type Paint = { mark: Mark; bands: Bands; color: string; index: number }

type Treatment = {
  id: string
  label: string
  note: string
  /** Paints the fin. Anything drawn is clipped to the silhouette. */
  render: (p: Paint) => ReactNode
}

const TREATMENTS: Treatment[] = [
  {
    id: 'badge',
    label: 'Badge',
    note: 'The mark centred on a white tail, like JAL or Lufthansa. The quietest option.',
    render: ({ mark, bands, color }) => {
      const [w, h] = mark.viewBox
      return (
          <>
            <rect width="100" height="110" fill={WHITE} />
            <TrackGroup mark={mark} bands={bands} color={color} transform={place(mark, Math.min(56 / w, 56 / h), 62, 72)} />
          </>
      )
    },
  },
  {
    id: 'stripes',
    label: 'Livery stripes',
    note: 'The lanes run in from the leading edge, spell the mark, then climb off the top as the paint scheme, like American or Thai.',
    render: ({ mark, bands, color }) => {
      const fit = FITS.stripes[mark.id as FinMarkId]
      return (
          <>
            <rect width="100" height="110" fill={color} />
            <TrackGroup
              mark={withStripes(mark, fit.turn ?? null)}
              bands={bands}
              color={WHITE}
              transform={place(mark, fit.s, fit.cx, fit.cy)}
            />
          </>
      )
    },
  },
  {
    id: 'crop',
    label: 'Oversized, cropped',
    note: 'The mark blown up and turned square to the leading edge so the tail shows only part of it, like easyJet or Jetstar.',
    render: ({ mark, bands, color, index }) => {
      const fit = FITS.crop[mark.id as FinMarkId]
      // Alternate white-on-colour and colour-on-white across the row.
      const reversed = index % 2 === 0
      return (
          <>
            <rect width="100" height="110" fill={reversed ? color : WHITE} />
            <TrackGroup
              mark={mark}
              bands={bands}
              color={reversed ? WHITE : color}
              transform={place(mark, fit.s, fit.cx, fit.cy, 90 - SWEEP)}
            />
          </>
      )
    },
  },
  {
    id: 'split',
    label: 'Split colour',
    note: 'Two colour fields meeting on a diagonal, with the mark straddling the seam, like Delta or Air Canada.',
    render: ({ mark, bands, color }) => {
      const [w, h] = mark.viewBox
      return (
          <>
            <rect width="100" height="110" fill={color} />
            <polygon points="-10,30 110,96 110,120 -10,120" fill={PAIRS[color] ?? PAIRS[INK]} />
            <TrackGroup mark={mark} bands={bands} color={WHITE} transform={place(mark, Math.min(60 / w, 60 / h), 62, 70)} />
          </>
      )
    },
  },
]

function Fin({ treatment, paint }: { treatment: Treatment; paint: Paint }) {
  const id = useId().replace(/:/g, '')
  return (
    <figure className="lg-fin">
      <svg viewBox="-1 -1 102 112" role="img" aria-label={`${paint.mark.label}, ${treatment.label.toLowerCase()} livery`}>
        <defs>
          <clipPath id={`f${id}`}>
            <path d={FIN} />
          </clipPath>
        </defs>
        <g clipPath={`url(#f${id})`}>{treatment.render(paint)}</g>
        {/* A hairline keeps white fins on a light page, and ink fins on a dark one, from losing their edge. */}
        <path d={FIN} fill="none" stroke="var(--rule)" vectorEffect="non-scaling-stroke" />
      </svg>
      <figcaption className="t-label text-ink-faint">{paint.mark.label}</figcaption>
    </figure>
  )
}

/** Every compact mark in every livery: one row per livery, like a sheet of airline tails. */
export function TailfinSheet({ bands, color }: { bands: Bands; color: string }) {
  // On a fin the ink option is paint, not the page's text colour.
  const paint = color === 'currentColor' ? INK : color
  return (
    <div className="lg-fins">
      {TREATMENTS.map((treatment) => (
        <section key={treatment.id} className="lg-fin-row" aria-labelledby={`lg-fin-${treatment.id}`}>
          <div className="lg-fin-meta">
            <h3 id={`lg-fin-${treatment.id}`} className="t-label">
              {treatment.label}
            </h3>
            <p className="text-sm leading-relaxed text-ink-muted">{treatment.note}</p>
          </div>
          <div className="lg-fin-grid">
            {FIN_MARKS.map((mark, index) => (
              <Fin key={mark.id} treatment={treatment} paint={{ mark, bands, color: paint, index }} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
