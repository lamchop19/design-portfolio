/**
 * Logo marks in the manner of Kenneth Hollick's 1974 Greater Manchester
 * Transport M: a route drawn as one continuous line, rounded at every turn,
 * rendered as parallel tracks. Each mark is a set of centerlines; track.tsx
 * turns them into bands.
 */

type Point = [number, number]

export type Mark = {
  id: string
  label: string
  note: string
  viewBox: [number, number]
  /** Track width in viewBox units. */
  width: number
  /** Corner radius for the routes. */
  radius: number
  /** Polyline routes, rounded at each vertex. */
  routes: Point[][]
  /** Solid shapes drawn with the tracks (arrowheads, station dots). */
  solids?: Array<{ kind: 'polygon'; points: Point[] } | { kind: 'circle'; at: Point; r: number }>
  /** Drawn inside a ring track, like a roundel. */
  ring?: { at: Point; r: number }
}

/**
 * A polyline with every corner replaced by a circular arc, so a stroked track
 * keeps its parallel lines through the turn. Radii shrink where segments are
 * too short to fit them.
 */
export function roundedPath(points: Point[], radius: number) {
  if (points.length < 2) return ''
  let d = `M${points[0][0]} ${points[0][1]}`
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i - 1]
    const [x, y] = points[i]
    const [nx, ny] = points[i + 1]
    const inLen = Math.hypot(x - px, y - py)
    const outLen = Math.hypot(nx - x, ny - y)
    const r = Math.min(radius, inLen / 2, outLen / 2)
    const ix = (x - px) / inLen
    const iy = (y - py) / inLen
    const ox = (nx - x) / outLen
    const oy = (ny - y) / outLen
    const sweep = ix * oy - iy * ox > 0 ? 1 : 0
    d += ` L${x - ix * r} ${y - iy * r} A${r} ${r} 0 0 ${sweep} ${x + ox * r} ${y + oy * r}`
  }
  const [lx, ly] = points[points.length - 1]
  return `${d} L${lx} ${ly}`
}

// Shared geometry: tracks 14 wide with a 6-unit gap between neighbouring legs,
// so a valley between two legs 20 apart is an exact half-circle.
const BASE = 86
const TOP = 14

export const MARKS: Mark[] = [
  {
    id: 'mal-ligature',
    label: 'MAL ligature',
    note: 'One route, three letters: two arches make the M, the second arch with its crossbar is the A, and its last leg runs out along the baseline as the L.',
    viewBox: [120, 100],
    width: 14,
    radius: 10,
    routes: [
      [
        [2, BASE],
        [16, BASE],
        [16, TOP],
        [44, TOP],
        [44, BASE],
        [64, BASE],
        [64, TOP],
        [92, TOP],
        [92, BASE],
        [118, BASE],
      ],
      [
        [64, 56],
        [92, 56],
      ],
    ],
  },
  {
    id: 'mal-route',
    label: 'MAL route',
    note: 'The initials spelled out in full along one line: two arches for M, a barred arch for A, and a long run-out for L.',
    viewBox: [170, 100],
    width: 14,
    radius: 10,
    routes: [
      [
        [2, BASE],
        [16, BASE],
        [16, TOP],
        [44, TOP],
        [44, BASE],
        [64, BASE],
        [64, TOP],
        [92, TOP],
        [92, BASE],
        [112, BASE],
        [112, TOP],
        [140, TOP],
        [140, BASE],
        [168, BASE],
      ],
      [
        [112, 56],
        [140, 56],
      ],
    ],
  },
  {
    id: 'mal-route-long',
    label: 'MAL route, long L',
    note: 'The same route with the run-out doubled, so the last leg and the baseline read as an L rather than a foot.',
    viewBox: [200, 100],
    width: 14,
    radius: 10,
    routes: [
      [
        [2, BASE],
        [16, BASE],
        [16, TOP],
        [44, TOP],
        [44, BASE],
        [64, BASE],
        [64, TOP],
        [92, TOP],
        [92, BASE],
        [112, BASE],
        [112, TOP],
        [140, TOP],
        [140, BASE],
        [198, BASE],
      ],
      [
        [112, 56],
        [140, 56],
      ],
    ],
  },
  {
    id: 'mal-route-stem',
    label: 'MAL route, L stem',
    note: 'The L gets its own upright, which curves into the line like a branch merging onto the main track. A full L: stem and foot.',
    viewBox: [200, 100],
    width: 14,
    radius: 10,
    routes: [
      [
        [2, BASE],
        [16, BASE],
        [16, TOP],
        [44, TOP],
        [44, BASE],
        [64, BASE],
        [64, TOP],
        [92, TOP],
        [92, BASE],
        [112, BASE],
        [112, TOP],
        [140, TOP],
        [140, BASE],
        [198, BASE],
      ],
      [
        [112, 56],
        [140, 56],
      ],
      [
        [162, TOP - 7],
        [162, BASE],
        [198, BASE],
      ],
    ],
  },
  {
    id: 'mal-route-arrow',
    label: 'MAL route, L stem + arrow',
    note: 'The stemmed L with the run-out ending in an arrowhead, so the whole name reads as a direction sign.',
    viewBox: [206, 100],
    width: 14,
    radius: 10,
    routes: [
      [
        [2, BASE],
        [16, BASE],
        [16, TOP],
        [44, TOP],
        [44, BASE],
        [64, BASE],
        [64, TOP],
        [92, TOP],
        [92, BASE],
        [112, BASE],
        [112, TOP],
        [140, TOP],
        [140, BASE],
        [186, BASE],
      ],
      [
        [112, 56],
        [140, 56],
      ],
      [
        [162, TOP - 7],
        [162, BASE],
        [186, BASE],
      ],
    ],
    solids: [
      {
        kind: 'polygon',
        points: [
          [185, 70],
          [204, BASE],
          [185, 102],
        ],
      },
    ],
  },
  {
    id: 'departing',
    label: 'Departing',
    note: 'The ligature with an arrowhead on the L, so the run-out reads as a sign pointing the way to the work.',
    viewBox: [124, 100],
    width: 14,
    radius: 10,
    routes: [
      [
        [2, BASE],
        [16, BASE],
        [16, TOP],
        [44, TOP],
        [44, BASE],
        [64, BASE],
        [64, TOP],
        [92, TOP],
        [92, BASE],
        [104, BASE],
      ],
      [
        [64, 56],
        [92, 56],
      ],
    ],
    solids: [
      {
        kind: 'polygon',
        points: [
          [103, 70],
          [122, BASE],
          [103, 102],
        ],
      },
    ],
  },
  {
    id: 'terminus',
    label: 'Terminus',
    note: 'The ligature ending at a station dot, like the last stop on a line diagram.',
    viewBox: [126, 100],
    width: 14,
    radius: 10,
    routes: [
      [
        [2, BASE],
        [16, BASE],
        [16, TOP],
        [44, TOP],
        [44, BASE],
        [64, BASE],
        [64, TOP],
        [92, TOP],
        [92, BASE],
        [106, BASE],
      ],
      [
        [64, 56],
        [92, 56],
      ],
    ],
    solids: [{ kind: 'circle', at: [114, BASE], r: 11 }],
  },
  {
    id: 'roundel',
    label: 'Roundel M',
    note: 'The M on its own inside a ring, the transit roundel. The tightest shape, made for the favicon.',
    viewBox: [100, 100],
    width: 9,
    radius: 7,
    routes: [
      [
        [27, 74],
        [27, 30],
        [45, 30],
        [45, 70],
        [55, 70],
        [55, 30],
        [73, 30],
        [73, 74],
      ],
    ],
    ring: { at: [50, 50], r: 43 },
  },
  {
    id: 'm-arches',
    label: 'M arches',
    note: 'The M alone, closest to Hollick’s mark: two arches with the feet turned out. A monogram rather than full initials.',
    viewBox: [100, 100],
    width: 14,
    radius: 10,
    routes: [
      [
        [0, BASE],
        [12, BASE],
        [12, TOP],
        [40, TOP],
        [40, BASE],
        [60, BASE],
        [60, TOP],
        [88, TOP],
        [88, BASE],
        [100, BASE],
      ],
    ],
  },
]

export type Bands = 'double' | 'triple' | 'solid'

export const BANDS: Array<{ id: Bands; label: string }> = [
  { id: 'double', label: 'Two lanes' },
  { id: 'triple', label: 'Three lanes' },
  { id: 'solid', label: 'Solid' },
]

export const COLORS = [
  { id: 'blue', label: 'Brand blue', value: '#0059ff' },
  { id: 'ink', label: 'Ink', value: 'currentColor' },
  { id: 'pink', label: 'Pink', value: '#f551ab' },
  { id: 'orange', label: 'GMT orange', value: '#ff6720' },
]
