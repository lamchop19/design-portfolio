import generated from './specimens.generated.json'

/*
 * Where the specimens sit in the ocean wallpaper (components/ocean).
 *
 * The page is a water column: fish drift through the upper part at a depth
 * given as a percentage of the page's height, and corals stand on the bed
 * along the bottom. Ids are the cuts printed by scripts/generate-specimens.tsx
 * (see .context/specimens-sheet.png after `npm run specimens -- --sheet`);
 * they are numbered top to bottom on each plate, so re-cutting a plate can
 * renumber them.
 */

type Cut = (typeof generated)[number]

export type Placement = {
  id: string
  /** Left edge, as a percentage of the page's width. */
  x: number
  /** Fish: depth, as a percentage of the page's height. Corals sit on the bed and ignore it. */
  depth?: number
  /** Far specimens print fainter and drift less with scroll. */
  layer: 'near' | 'far'
  flip?: boolean
  /** Prints a second time in fluoro orange, a little off register. */
  second?: boolean
  /** Left out on phones, where there is room for fewer. */
  desktopOnly?: boolean
}

export type Specimen = Placement & { kind: 'fish' | 'coral'; width: number; height: number; src: string }

const CORALS: Placement[] = [
  { id: 'kent-chromo-ix-corals-04', x: -2, layer: 'near' },
  { id: 'kent-chromo-ix-corals-09', x: 11, layer: 'far', desktopOnly: true },
  { id: 'kent-chromo-corals-b-01', x: 22, layer: 'near', second: true },
  { id: 'kent-chromo-ix-corals-01', x: 39, layer: 'far', desktopOnly: true },
  { id: 'kent-chromo-corals-b-04', x: 50, layer: 'near' },
  { id: 'kent-chromo-ix-corals-07', x: 65, layer: 'far', desktopOnly: true },
  { id: 'kent-chromo-ix-corals-08', x: 79, layer: 'near' },
  { id: 'kent-chromo-corals-b-16', x: 88, layer: 'far', desktopOnly: true },
]

const cuts = new Map<string, Cut>(generated.map((cut) => [cut.id, cut]))

function resolve(kind: Specimen['kind'], placements: Placement[]): Specimen[] {
  return placements.flatMap((placement) => {
    const cut = cuts.get(placement.id)
    if (!cut) {
      // A re-cut plate renumbered; leave the gap rather than break the build.
      if (process.env.NODE_ENV !== 'production') console.warn(`[specimens] no cut named ${placement.id}`)
      return []
    }
    return [{ ...placement, kind, width: cut.width, height: cut.height, src: `/specimens/${cut.id}.png` }]
  })
}

export const SPECIMENS: Specimen[] = resolve('coral', CORALS)
