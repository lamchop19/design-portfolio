import generated from '@/lib/flora.generated.json'
import { asset } from '@/lib/paths'

import './flora.css'

type Entry = (typeof generated)[number]

const entries = new Map<string, Entry>(generated.map((entry) => [entry.id, entry]))

/** The specimens chosen for riso from the contact sheet (.context/flora-sheet.png, `npm run flora -- --sheet`). */
export const FLORA_PICKS = [
  'twin-1',
  'shelf-4',
  'stone-2',
  'bell-1',
  'frond-1',
  'twin-4',
  'stone-6',
  'shelf-5',
  'bell-5',
  'frond-4',
  'stone-4',
  'shelf-1',
] as const

/** The specimens chosen for the airbrush render (.context/flora-air-sheet.png): softer, more flowers. */
export const AIR_PICKS = [
  'puff-3',
  'daisy-2',
  'bell-5',
  'puff-1',
  'twin-4',
  'daisy-6',
  'frond-3',
  'stone-4',
  'puff-6',
  'daisy-1',
  'shelf-1',
  'bell-2',
] as const

/**
 * One folk plant (src/lib/flora.ts), printed as stacked 1-bit masks, one per
 * ink role, each coloured in CSS, or as its airbrush render. The palette
 * comes from the nearest `data-palette` ancestor: two-ink riso by default,
 * 'full', or 'air' (the soft, grainy colour image instead of the masks).
 *
 * Its size is the bitmap's, in whole dots (`--flora-dot`, default the page's
 * `--dot`), so it stays crisp; set the dot, not the width. Inside a
 * `.flora-sm` container it prints the smaller bitmap instead.
 */
export function Flora({ id, flip, className }: { id: string; flip?: boolean; className?: string }) {
  const entry = entries.get(id)
  if (!entry) return null
  return (
    <span
      className={['flora', className].filter(Boolean).join(' ')}
      data-flip={flip || undefined}
      aria-hidden="true"
      style={{ '--air': `url(${asset(`/flora/air/${id}.webp`)})` } as React.CSSProperties}
    >
      {entry.roles.map((role) => (
        <span
          key={role}
          className="flora-ink"
          data-role={role}
          style={
            {
              '--mask': `url(${asset(`/flora/${id}-${role}.png`)})`,
              '--mask-sm': `url(${asset(`/flora/${id}-${role}-sm.png`)})`,
              '--full': `var(--ink-${entry.inks[role as keyof Entry['inks']]}, var(--surface))`,
            } as React.CSSProperties
          }
        />
      ))}
    </span>
  )
}
