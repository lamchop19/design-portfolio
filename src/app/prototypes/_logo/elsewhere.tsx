import { useId } from 'react'

import { GLYPHS } from '@/components/brand/led-matrix'

/**
 * Logo ideas from sources other than transit identities. Each draws as a
 * self-contained SVG so it can also be tried as the favicon. Text uses the
 * site's display face, with system fallbacks for when the SVG is served on
 * its own (a favicon can't see the page's web fonts).
 */

const DISPLAY = 'var(--font-display), "Arial Black", "Helvetica Neue", Arial, sans-serif'
const MONO = 'var(--font-geist-mono), ui-monospace, Menlo, monospace'

type Props = { className?: string; compact?: boolean }

export type Elsewhere = {
  id: string
  label: string
  source: string
  note: string
  Mark: (props: Props) => React.ReactElement
}

/** Barcode bars from a string, the same every render: [x, width] from `start`. */
function bars(seed: string, count: number, start: number) {
  let h = 7
  let x = start
  return Array.from({ length: count }, (_, i) => {
    h = (h * 31 + seed.charCodeAt(i % seed.length)) % 997
    const w = 1 + (h % 3)
    const bar: [number, number] = [x, w]
    x += w + 2
    return bar
  })
}

function BagTag({ className, compact }: Props) {
  const id = useId().replace(/:/g, '')
  if (compact) {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <rect width="64" height="64" rx="12" fill="#0059ff" />
        <text x="32" y="42" textAnchor="middle" fontSize="25" fontWeight="800" fill="#fff" style={{ fontFamily: DISPLAY }}>
          MAL
        </text>
        <rect x="10" y="48" width="44" height="3" fill="#fff" opacity="0.7" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 160 96" className={className} aria-hidden="true">
      <mask id={`h${id}`}>
        <rect width="160" height="96" fill="white" />
        <circle cx="17" cy="48" r="5.5" fill="black" />
      </mask>
      <path d="M22 4h130a6 6 0 0 1 6 6v76a6 6 0 0 1-6 6H22L4 74V22z" fill="#0059ff" mask={`url(#h${id})`} />
      <text x="40" y="22" fontSize="8" letterSpacing="1" fill="#fff" style={{ fontFamily: MONO }}>
        NYC → ANYWHERE · TN25
      </text>
      <text x="38" y="66" fontSize="50" fontWeight="800" letterSpacing="-1.5" fill="#fff" style={{ fontFamily: DISPLAY }}>
        MAL
      </text>
      {bars('MAL25', 26, 44).map(([x, w]) => (
        <rect key={x} x={x} y="74" width={w} height="12" fill="#fff" />
      ))}
    </svg>
  )
}

function Stamp({ className, compact }: Props) {
  const id = useId().replace(/:/g, '')
  const ink = '#d6336c'
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <defs>
        {/* A little roughness, like ink from a rubber stamp. */}
        <filter id={`r${id}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" />
          <feDisplacementMap in="SourceGraphic" scale="1.6" />
        </filter>
        <path id={`c${id}`} d="M60 60m-41 0a41 41 0 1 1 82 0a41 41 0 1 1-82 0" />
      </defs>
      <g transform="rotate(-10 60 60)" filter={compact ? undefined : `url(#r${id})`} fill="none" stroke={ink}>
        <circle cx="60" cy="60" r="55" strokeWidth={compact ? 7 : 3.5} />
        {compact ? null : <circle cx="60" cy="60" r="49" strokeWidth="1.5" />}
        {compact ? null : <circle cx="60" cy="60" r="31" strokeWidth="1.5" />}
        {compact ? null : (
          <text fontSize="8" letterSpacing="1.6" fill={ink} stroke="none" style={{ fontFamily: MONO }}>
            {/* Sized to run once round the ring without meeting itself. */}
            <textPath href={`#c${id}`} textLength="250" lengthAdjust="spacing">
              ARRIVED · NEW YORK · BRAND · SOCIAL ·
            </textPath>
          </text>
        )}
        <text
          x="60"
          y={compact ? 74 : 67}
          textAnchor="middle"
          fontSize={compact ? 40 : 22}
          fontWeight="800"
          fill={ink}
          stroke="none"
          style={{ fontFamily: DISPLAY }}
        >
          MAL
        </text>
        {compact ? null : (
          <text x="60" y="80" textAnchor="middle" fontSize="7" letterSpacing="1.5" fill={ink} stroke="none" style={{ fontFamily: MONO }}>
            2024—25
          </text>
        )}
      </g>
    </svg>
  )
}

function Shield({ className, compact }: Props) {
  const id = useId().replace(/:/g, '')
  const outline = 'M50 4c14 0 28 3 40 8 1 6 2 14 2 22 0 36-17 58-42 72C25 92 8 70 8 34c0-8 1-16 2-22C22 7 36 4 50 4z'
  return (
    <svg viewBox="0 0 100 110" className={className} aria-hidden="true">
      <clipPath id={`s${id}`}>
        <path d={outline} />
      </clipPath>
      <g clipPath={`url(#s${id})`}>
        <rect width="100" height="110" fill="#0059ff" />
        <rect width="100" height="32" fill="#f551ab" />
      </g>
      <path d={outline} fill="none" stroke="#fff" strokeWidth="3" transform="translate(50 55) scale(0.9) translate(-50 -55)" />
      {compact ? null : (
        <text x="50" y="25" textAnchor="middle" fontSize="11" fontWeight="700" letterSpacing="1.5" fill="#0a0f1f" style={{ fontFamily: DISPLAY }}>
          NYC
        </text>
      )}
      <text x="50" y={compact ? 76 : 72} textAnchor="middle" fontSize={compact ? 34 : 31} fontWeight="800" letterSpacing="-1" fill="#fff" style={{ fontFamily: DISPLAY }}>
        MAL
      </text>
    </svg>
  )
}

function Wings({ className, compact }: Props) {
  const gold = '#c99a2e'
  const feathers = [0, 1, 2, 3, 4]
  const wing = (side: 1 | -1) =>
    feathers.map((i) => {
      const y = 30 + i * 7
      const reach = 92 - i * 14
      // Each feather is a tapered sweep out from the badge, shorter as it drops.
      const d = `M${100 - side * 20} ${y} C ${100 - side * (reach * 0.55)} ${y - 7}, ${100 - side * reach} ${y - 8}, ${100 - side * (reach + 6)} ${y - 6} C ${100 - side * reach} ${y + 1}, ${100 - side * (reach * 0.55)} ${y + 4}, ${100 - side * 20} ${y + 5} Z`
      return <path key={`${side}${i}`} d={d} fill={gold} />
    })
  if (compact) {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <rect width="64" height="64" rx="12" fill="#0a0f1f" />
        <circle cx="32" cy="32" r="21" fill="none" stroke={gold} strokeWidth="4" />
        <text x="32" y="40" textAnchor="middle" fontSize="20" fontWeight="800" fill={gold} style={{ fontFamily: DISPLAY }}>
          M
        </text>
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 200 80" className={className} aria-hidden="true">
      {wing(1)}
      {wing(-1)}
      <circle cx="100" cy="40" r="24" fill="#0a0f1f" stroke={gold} strokeWidth="3" />
      <text x="100" y="47" textAnchor="middle" fontSize="18" fontWeight="800" letterSpacing="-0.5" fill={gold} style={{ fontFamily: DISPLAY }}>
        MAL
      </text>
    </svg>
  )
}

function Bauhaus({ className, compact }: Props) {
  const tiles = (
    <>
      {/* M: two arches cut from a square. */}
      <rect x="0" y="0" width="50" height="50" fill="#0059ff" />
      <path d="M7 44V20a9 9 0 0 1 18 0v24h-6V20a3 3 0 0 0-6 0v24zM25 44V20a9 9 0 0 1 18 0v24h-6V20a3 3 0 0 0-6 0v24z" fill="#fff" />
      {compact ? null : (
        <>
          {/* A: a triangle in a circle. */}
          <circle cx="80" cy="25" r="25" fill="#f551ab" />
          <path d="M80 8 97 40H63z" fill="#0a0f1f" />
          <rect x="70" y="30" width="20" height="4" fill="#f551ab" />
          {/* L: a block corner on a green quarter. */}
          <path d="M110 0h40v50h-50V10a10 10 0 0 1 10-10z" fill="#81db89" />
          <path d="M112 8h9v31h21v9h-30z" fill="#0a0f1f" />
        </>
      )}
    </>
  )
  return (
    <svg viewBox={compact ? '0 0 50 50' : '0 0 150 50'} className={className} aria-hidden="true">
      {tiles}
    </svg>
  )
}

function LampTile({ className, compact }: Props) {
  const text = compact ? 'M' : 'MAL'
  const cols = text.length * 6 - 1
  const pad = 2
  // The single-letter favicon is squared up so it fills a tab icon.
  const h = 7 + pad * 2
  const w = compact ? h : cols + pad * 2
  const left = (w - cols) / 2
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} aria-hidden="true">
      <rect width={w} height={h} rx={compact ? 2.2 : 1.6} fill="#0a0f1f" />
      {[...text].flatMap((ch, i) =>
        GLYPHS[ch].split('|').flatMap((row, y) =>
          [...row].map((cell, x) => (
            <circle
              key={`${i}-${x}-${y}`}
              cx={left + 0.5 + i * 6 + x}
              cy={pad + 0.5 + y}
              r={0.43}
              fill={cell === '#' ? '#9df0a5' : '#1a2236'}
            />
          )),
        ),
      )}
    </svg>
  )
}

function Hanko({ className, compact }: Props) {
  const red = '#d9342b'
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <rect x="2" y="2" width="96" height="96" rx="14" fill={red} />
      <rect x="9" y="9" width="82" height="82" rx="9" fill="none" stroke="#fff" strokeWidth={compact ? 4 : 2.5} />
      {[
        ['M', 30, 46],
        ['A', 70, 46],
        ['L', 30, 84],
      ].map(([ch, x, y]) => (
        <text key={ch as string} x={x} y={y} textAnchor="middle" fontSize="34" fontWeight="800" fill="#fff" style={{ fontFamily: DISPLAY }}>
          {ch}
        </text>
      ))}
      {/* The fourth cell carries a small plane instead of a letter. */}
      <path
        fill="#fff"
        transform="translate(58 58) scale(1.05) rotate(45 12 12)"
        d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
      />
    </svg>
  )
}

export const ELSEWHERE: Elsewhere[] = [
  {
    id: 'bag-tag',
    label: 'Baggage tag',
    source: 'IATA airline baggage tags',
    note: 'MAL treated as an airport code on a routing label, with the barcode and route line a real tag carries.',
    Mark: BagTag,
  },
  {
    id: 'stamp',
    label: 'Passport stamp',
    source: 'Immigration entry stamps',
    note: 'An arrival stamp in pink ink, with the disciplines running round the ring and a little roughness in the print.',
    Mark: Stamp,
  },
  {
    id: 'shield',
    label: 'Highway shield',
    source: 'US Interstate route shield (1957)',
    note: 'The road-sign shield with NYC in the crown and the initials where the route number goes.',
    Mark: Shield,
  },
  {
    id: 'wings',
    label: 'Pilot wings',
    source: 'Airline aviator badges',
    note: 'Wings either side of a round badge carrying the initials, the way crew insignia carry an airline’s mark.',
    Mark: Wings,
  },
  {
    id: 'bauhaus',
    label: 'Bauhaus blocks',
    source: 'Bauhaus and Chermayeff & Geismar geometric marks',
    note: 'Each letter built from one primitive in the brand palette: arches cut from a square, a triangle in a circle, a block L.',
    Mark: Bauhaus,
  },
  {
    id: 'lamp',
    label: 'Lamp tile',
    source: 'The new LED wordmark',
    note: 'The initials on the same 5 × 7 lamps as the homepage wordmark, lit green on a board. The favicon carries just the M.',
    Mark: LampTile,
  },
  {
    id: 'hanko',
    label: 'Hanko seal',
    source: 'Japanese name seals',
    note: 'A red name seal split into four cells: M, A and L, with a plane in the fourth.',
    Mark: Hanko,
  },
]
