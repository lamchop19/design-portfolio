import { useId } from 'react'

import type { Elsewhere } from './elsewhere'

/**
 * Slab marks, after the 1970s College Misericordia CM: the initials as one
 * solid block with rounded outer corners, the letters drawn into it with
 * hairline cuts and a few notches in the silhouette. Cuts are a mask, so the
 * slab takes any colour and the page shows through the lines.
 */

const BLUE = '#2f6fbe'

// The block: rounded on the left like the CM's C, stepped down at the right
// so the last letter's silhouette is an L.
const SLAB =
  'M24 0H262V62H306Q320 62 320 76V86Q320 100 306 100H24A24 24 0 0 1 0 76V24A24 24 0 0 1 24 0Z'

/** The M on its own, for the favicon. */
const M_BLOCK = 'M24 0H100A24 24 0 0 1 124 24V76A24 24 0 0 1 100 100H24A24 24 0 0 1 0 76V24A24 24 0 0 1 24 0Z'

type Props = { className?: string; compact?: boolean; color?: string }

function Slab({
  className,
  compact,
  color = BLUE,
  cuts,
  notches,
}: Props & { cuts: string[]; notches: string[] }) {
  const id = useId().replace(/:/g, '')
  const w = compact ? 124 : 320
  // In the favicon the hairlines thicken so they survive at 16 px.
  const hair = compact ? 7 : 3
  // The favicon keeps only the cuts that start inside the M (x < 124).
  const keep = (d: string) => !compact || parseFloat(d.slice(1)) < 120
  return (
    <svg viewBox={`-2 -2 ${w + 4} 104`} className={className} aria-hidden="true">
      <mask id={`k${id}`} maskUnits="userSpaceOnUse" x="-2" y="-2" width={w + 4} height="104">
        <path d={compact ? M_BLOCK : SLAB} fill="white" />
        {notches.filter(keep).map((d) => (
          <path key={d} d={d} fill="black" />
        ))}
        <g fill="none" stroke="black" strokeWidth={hair} strokeLinecap="square" strokeLinejoin="miter">
          {cuts.filter(keep).map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      </mask>
      <rect x="-2" y="-2" width={w + 4} height="104" fill={color} mask={`url(#k${id})`} />
    </svg>
  )
}

/** Letters drawn only with hairlines: a V and a slit for M, a barred Λ for A. */
export function SlabHairline(props: Props) {
  return (
    <Slab
      {...props}
      notches={[]}
      cuts={[
        // M: the V down from the top edge, and the opening between the legs
        // outlined from below, so the diagonals read as strokes.
        'M34 -4L62 50L90 -4',
        'M26 104V30L62 86L98 30V104',
        // Letter joints.
        'M124 -4V104',
        'M224 -4V104',
        // A: a Λ up from the baseline with its crossbar.
        'M140 104L174 22L208 104',
        'M157 62H191',
      ]}
    />
  )
}

/** Letters cut into the silhouette: a V notch for M, a chamfered A with an arch beneath. */
export function SlabNotched(props: Props) {
  return (
    <Slab
      {...props}
      notches={[
        // M: a V wedge out of the top edge, and the gap between the legs out of
        // the base, leaving two legs and two diagonals.
        'M32 -4L62 50L92 -4Z',
        'M26 104V30L62 86L98 30V104Z',
        // A: both top corners chamfered to a point, a wedge out of the base, and a small counter.
        'M122 -4V54L158 -4Z',
        'M226 -4V54L190 -4Z',
        'M150 104L174 64L198 104Z',
        'M168 46L174 32L180 46Z',
      ]}
      cuts={['M124 -4V104', 'M224 -4V104']}
    />
  )
}

export const SLABS: Elsewhere[] = [
  {
    id: 'slab-hairline',
    label: 'Slab, hairline',
    source: 'College Misericordia CM (1970s)',
    note: 'One solid block, rounded at the left. The letters are drawn only with hairline cuts: a V and the outline of the legs for M, a barred Λ for A, and the step down at the end gives the L.',
    Mark: SlabHairline,
  },
  {
    id: 'slab-notched',
    label: 'Slab, notched',
    source: 'College Misericordia CM (1970s)',
    note: 'The same block with the letters cut into its outline instead: a V notch for M, a pointed, chamfered A, and the stepped L. Bolder, and it survives as a favicon.',
    Mark: SlabNotched,
  },
]
