/**
 * The scenes: big airbrushed pictures for the homepage, after Hiroshi Nagai's
 * covers and the aquarium. scripts/generate-scenes.tsx paints each variant
 * into public/scenes/<id>-<variant>.webp (2400 × 1350), with its motion
 * beside it in <id>-<variant>.json: the dots that twinkle over the still, and
 * any layer that moves (public/scenes/<id>-<variant>-<layer>.webp).
 * /prototypes/scenes shows them. This file is only the list, so the browser
 * can read it; the painting lives in scripts/scenes.
 */

export type SceneMeta = {
  id: string
  name: string
  /** What it's after: the reference it grew from. */
  after: string
  note: string
  variants: string[]
  /** Where to keep in frame when a placement crops it, as fractions of width and height. */
  focus: [number, number]
  /** Whether type over it should be light or dark, per variant (the first is the default). */
  ink: Record<string, 'light' | 'dark'>
}

export const SCENE_SIZE = { width: 2400, height: 1350 } as const

export const SCENES: SceneMeta[] = [
  {
    id: 'breaker',
    name: 'Breaker',
    after: 'Nagai’s cover for Eiichi Ohtaki’s “Ame no Wednesday”',
    note: 'A long wave breaking in white speckle under a cobalt sky, a traffic light on its arm and a palm, over the striped verge of a coast road. The lit lamp is the brand green. At golden hour the sun sits low behind the wave and shines through its spray.',
    variants: ['day', 'golden'],
    focus: [0.84, 0.45],
    ink: { day: 'light', golden: 'light' },
  },
  {
    id: 'night-flight',
    name: 'Night flight',
    after: 'Nagai’s airliner over the city at dusk',
    note: 'A jet crossing a violet dusk over the sea, the city below a field of lights: the logo’s dot screen as a skyline. Later at night a moon is up, fewer windows are lit, and the jet’s beacons are on.',
    variants: ['dusk', 'night'],
    focus: [0.45, 0.45],
    ink: { dusk: 'light', night: 'light' },
  },
  {
    id: 'coast-road',
    name: 'Coast road',
    after: 'Nagai’s cover for “Umi ni Ikou yo” (Shall we head to the sea?)',
    note: 'A red ’62 Thunderbird convertible on a pink coast road, a wave curling in behind it and one tall palm. Golden hour stretches its shadows long.',
    variants: ['day', 'golden'],
    focus: [0.45, 0.65],
    ink: { day: 'light', golden: 'light' },
  },
  {
    id: 'poolside',
    name: 'Poolside',
    after: 'Nagai’s pool paintings',
    note: 'A turquoise pool netted with light, white tiles, a ladder and a diving board, a white modernist house striped with blinds, and a palm’s shadow across it.',
    variants: ['afternoon'],
    focus: [0.6, 0.55],
    ink: { afternoon: 'light' },
  },
  {
    id: 'horizon',
    name: 'Horizon',
    after: 'the setting sun on 1980s record sleeves',
    note: 'A banded sun going down into a speckled sea, its light a path of glints, a sailboat small against it; at night a big moon and a silver path. Quiet enough to set type over.',
    variants: ['dusk', 'night'],
    focus: [0.6, 0.55],
    ink: { dusk: 'light', night: 'light' },
  },
  {
    id: 'reef',
    name: 'Reef',
    after: 'the aquarium and the Saville-Kent plates',
    note: 'A reef seen from the sand: brain, plate and staghorn coral and sea fans fading blue row on row, a sunlit bommie, pink and silver schools high on either side, and light falling in shafts onto sand netted with caustics. A parrotfish drifts by.',
    variants: ['day'],
    focus: [0.55, 0.55],
    ink: { day: 'dark' },
  },
  {
    id: 'glow-reef',
    name: 'Glow reef',
    after: 'the DVD menu’s glowing jellies',
    note: 'The reef after dark: jellies lit from inside bob over corals glowing in the brand’s inks, with plankton drifting in dot-matrix veils under a faint moonlit surface.',
    variants: ['night'],
    focus: [0.47, 0.5],
    ink: { night: 'light' },
  },
  {
    id: 'record-store',
    name: 'Record store',
    after: 'Nagai’s record store at dusk',
    note: 'Five shopfronts under lit towers and two tall fan palms: a café, a boutique, the record store with a pink neon round its sign, a florist and a launderette. The signs are left blank so the site can letter its own: About, Experience, Work, Scraps, Contact. At night every window glows, the moon is up and a car’s lights cross the road.',
    variants: ['dusk', 'night'],
    focus: [0.5, 0.7],
    ink: { dusk: 'light', night: 'light' },
  },
  {
    id: 'flower-field',
    name: 'Flower field',
    after: 'the flora, and the wildflower paintings on Marc’s board',
    note: 'Rolling hills sprayed with flowers in the brand’s inks, in drifts that run to bands in the distance; a path winds up to a glasshouse past a lone tree, with cosmos and poppies in front. At dusk the flowers glow, the glasshouse is lit and fireflies come out.',
    variants: ['day', 'dusk'],
    focus: [0.5, 0.6],
    ink: { day: 'light', dusk: 'light' },
  },
]

export const sceneFile = (id: string, variant: string, layer?: string) => `/scenes/${id}-${variant}${layer ? `-${layer}` : ''}.webp`
export const motionFile = (id: string, variant: string) => `/scenes/${id}-${variant}.json`

/**
 * The time of day by the clock in the site's frame (New York): the homepage
 * could show each scene in the variant that matches it. Fixed hours for now;
 * they could follow the season's sunset.
 */
const SLOTS: Array<[from: number, slot: string]> = [
  [0, 'night'],
  [6, 'day'],
  [12, 'afternoon'],
  [16, 'golden'],
  [18, 'dusk'],
  [20, 'night'],
]

/** What to show for each time of day, best first, when a scene hasn't that variant. */
const FALLBACK: Record<string, string[]> = {
  day: ['day', 'afternoon', 'golden', 'dusk', 'night'],
  afternoon: ['afternoon', 'day', 'golden', 'dusk', 'night'],
  golden: ['golden', 'dusk', 'afternoon', 'day', 'night'],
  dusk: ['dusk', 'golden', 'night', 'afternoon', 'day'],
  night: ['night', 'dusk', 'golden', 'afternoon', 'day'],
}

export const slotAt = (hour: number) => SLOTS.findLast(([from]) => hour >= from)?.[1] ?? 'night'

/** The scene's variant for an hour of the day (0–23). */
export function variantAt(scene: SceneMeta, hour: number) {
  return FALLBACK[slotAt(hour)].find((v) => scene.variants.includes(v)) ?? scene.variants[0]
}
