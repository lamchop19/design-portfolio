'use client'

import { LiveClock } from '@/components/brand/live-clock'
import { WindowShade } from '@/components/layout/window-shade'

import { legClass, legs } from './legs'

/** Wayfinding pictograms on a 24-unit grid, stroked in the current colour. */
const pictograms = {
  plane: (
    <path
      fill="currentColor"
      stroke="none"
      transform="rotate(45 12 12)"
      d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
    />
  ),
  suitcase: (
    <>
      <rect x="3" y="7.5" width="18" height="12.5" rx="1.5" />
      <path d="M9 7.5V4.5h6v3M3 12.5h18" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 10.5v7" />
      <circle cx="12" cy="7" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  escalator: (
    <>
      <path d="M2.5 19h5l9-11.5h5" />
      <circle cx="11.5" cy="4.3" r="1.8" fill="currentColor" stroke="none" />
      <path d="M11.5 7.5v5" strokeWidth="2.8" />
    </>
  ),
  envelope: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="1" />
      <path d="M3.5 6.5 12 13l8.5-6.5" />
    </>
  ),
}

export type PictogramName = keyof typeof pictograms

export function Pictogram({ name, className }: { name: PictogramName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={['sign-picto', className].filter(Boolean).join(' ')}>
      {pictograms[name]}
    </svg>
  )
}

/** A heavy sign arrow, pointing down; `data-dir="up"` turns it round. */
export function SignArrow({ dir }: { dir: 'up' | 'down' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="sign-arrow" data-dir={dir}>
      <path d="M10.3 3h3.4v12.4l4.7-4.7 2.4 2.4L12 21.9l-8.8-8.8 2.4-2.4 4.7 4.7z" />
    </svg>
  )
}

/** The plates, one per destination along the route. Indexes are into `legs`. */
const plates: Array<{ leg: number; label: string; picto: PictogramName }> = [
  { leg: 1, label: 'Work', picto: 'suitcase' },
  { leg: 2, label: 'About', picto: 'info' },
  { leg: 3, label: 'Experience', picto: 'escalator' },
  { leg: 4, label: 'Contact', picto: 'envelope' },
]

/**
 * The top strip as airport signage: the clock, then a black plate per section.
 * Plates show only their pictogram; pointed at or focused, one opens out to
 * its name and an arrow pointing the way from the leg in view. The plate for
 * that leg stays open, naming where you are. Takes the colours of the leg in view.
 */
export function SignStrip({ active, onJump }: { active: number; onJump: (leg: number) => void }) {
  return (
    <header className={`${legClass(legs[active].id)} flight-strip sign-strip`}>
      <div className="swiss-grid items-center py-[15px]">
        <LiveClock className="t-label col-span-1 whitespace-nowrap md:col-span-3" />
        <nav aria-label="Sections" className="col-span-3 flex items-center justify-end gap-1.5 md:col-span-9 md:gap-2">
          {plates.map((plate, i) => {
            const here = plate.leg === active
            return (
              <button
                key={plate.label}
                type="button"
                onClick={() => onJump(plate.leg)}
                className="sign-plate"
                data-here={here || undefined}
                aria-current={here ? 'location' : undefined}
                aria-label={plate.label}
                style={{ '--i': i } as React.CSSProperties}
              >
                <Pictogram name={plate.picto} />
                <span className="sign-plate-more" aria-hidden="true">
                  <span>
                    <span className="sign-plate-label">{plate.label}</span>
                    <SignArrow dir={plate.leg < active ? 'up' : 'down'} />
                  </span>
                </span>
              </button>
            )
          })}
          <span className="sign-plate-shade" style={{ '--i': plates.length } as React.CSSProperties}>
            <WindowShade inline />
          </span>
        </nav>
      </div>
    </header>
  )
}
