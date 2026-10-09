import { SplitFlap } from '@/components/split-flap/split-flap'
import { flightCode, type WorkItem } from '@/lib/work-items'

/**
 * Scenery for the baggage hall, drawn behind the sign-off and the belt and
 * clipped to the footer. Purely decorative: every layer is aria-hidden and
 * lets the pointer through.
 */

export type BackdropKind = 'none' | 'board' | 'sign' | 'window' | 'terrazzo'

export const backdrops: Array<[BackdropKind, string]> = [
  ['none', 'None'],
  ['board', 'Arrivals board'],
  ['sign', 'Carousel sign'],
  ['window', 'Terminal window'],
  ['terrazzo', 'Terrazzo floor'],
]

export function Backdrop({ kind, items }: { kind: BackdropKind; items: WorkItem[] }) {
  if (kind === 'none') return null
  return (
    <div className="bc-backdrop" data-backdrop={kind} aria-hidden="true">
      {kind === 'board' ? <Board items={items} /> : null}
      {kind === 'sign' ? <Sign /> : null}
      {kind === 'window' ? <Window /> : null}
      {kind === 'terrazzo' ? <Terrazzo /> : null}
    </div>
  )
}

/** The arrivals board, ghosted: every case study is a flight that has reached carousel 01. */
function Board({ items }: { items: WorkItem[] }) {
  return (
    <div className="bc-board swiss-grid t-label">
      <div className="col-span-full grid grid-cols-subgrid gap-y-2">
        <span className="col-span-1">Flight</span>
        <span className="col-span-2 md:col-span-5">From</span>
        <span className="hidden md:col-span-2 md:block">Belt</span>
        <span className="hidden md:col-span-2 md:block">Status</span>
        {items.map((item, i) => (
          <div key={item.meta.slug} className="col-span-full grid grid-cols-subgrid">
            <span className="col-span-1">{flightCode(item.meta)}</span>
            <span className="col-span-2 truncate md:col-span-5">{item.meta.title}</span>
            <span className="hidden md:col-span-2 md:block">01</span>
            <span className="hidden md:col-span-2 md:block">
              <SplitFlap text="On belt" length={8} trigger="visible" intro="quick" delay={600 + i * 120} />
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** A wayfinding sign hung from the ceiling: the baggage pictogram and the carousel number. */
function Sign() {
  return (
    <div className="bc-sign">
      <span className="bc-sign-pict">
        <svg viewBox="0 0 48 48" fill="currentColor">
          {/* A suitcase on the belt. */}
          <path d="M19 9h10a2 2 0 0 1 2 2v4h-3v-3h-8v3h-3v-4a2 2 0 0 1 2-2Z" />
          <rect x="11" y="15" width="26" height="20" rx="2.5" />
          <rect x="4" y="38" width="40" height="3" rx="1.5" />
          <circle cx="9" cy="44" r="2" />
          <circle cx="24" cy="44" r="2" />
          <circle cx="39" cy="44" r="2" />
        </svg>
      </span>
      <span className="bc-sign-no">1</span>
    </div>
  )
}

/** Terminal glass: mullions on the grid gutters, the apron's horizon, and a plane taxiing out and lifting off. */
function Window() {
  return (
    <div className="bc-window">
      <div className="bc-window-apron" />
      <svg className="bc-window-plane" viewBox="0 0 120 40" fill="currentColor">
        <path d="M14 18h86c8 0 14 3 16 6-2 3-8 4-16 4H18c-4 0-6-2-6-5z" />
        <path d="M14 18 6 4h8l16 14z" />
        <path d="M8 20h18l-4 2H10z" />
        <path d="M52 25h22l-12 7h-8z" />
        <rect x="56" y="29" width="14" height="5" rx="2.5" />
        <path d="M39 28h2v6h-2zM99 28h2v6h-2z" />
        <circle cx="40" cy="36" r="2" />
        <circle cx="100" cy="36" r="2" />
      </svg>
    </div>
  )
}

/** Terrazzo: chips of the brand colours set in the floor, seeded so server and client agree. */
const CHIPS = (() => {
  let seed = 20250101
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 2 ** 32
  }
  const tones = ['blue', 'pink', 'green', 'ink', 'ink']
  return Array.from({ length: 420 }, () => {
    // An irregular chip: five points around the centre at uneven radii.
    const points = Array.from({ length: 5 }, (_, k) => {
      const angle = ((k + rand() * 0.6) / 5) * Math.PI * 2
      const radius = 30 + rand() * 20
      return `${(50 + Math.cos(angle) * radius).toFixed(1)}% ${(50 + Math.sin(angle) * radius).toFixed(1)}%`
    })
    return {
      x: rand() * 100,
      y: rand() * 100,
      size: 3 + rand() ** 2 * 10,
      shape: `polygon(${points.join(', ')})`,
      tone: tones[Math.floor(rand() * tones.length)],
    }
  })
})()

function Terrazzo() {
  return (
    <>
      <div className="bc-terrazzo">
        {CHIPS.map((chip, i) => (
          <span
            key={i}
            data-tone={chip.tone}
            style={{ left: `${chip.x}%`, top: `${chip.y}%`, width: chip.size, height: chip.size, clipPath: chip.shape }}
          />
        ))}
      </div>
      {/* The line to wait behind, painted on the floor just short of the belt. */}
      <div className="bc-wait-line" />
    </>
  )
}
