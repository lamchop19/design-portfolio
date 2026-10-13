/**
 * Every effect the LED lab can switch on, with a note and, where one exists,
 * the Mobbin reference it came from.
 */
export type Option<Id extends string = string> = {
  id: Id
  label: string
  note: string
  ref?: { name: string; url: string }
}

export const COLOURS = {
  ink: { label: 'Ink', value: 'var(--ink)' },
  blue: { label: 'Blue', value: '#4d8cff' },
  amber: { label: 'Amber', value: '#ffb23f' },
  green: { label: 'Green', value: 'var(--brand-green)' },
  pink: { label: 'Pink', value: 'var(--brand-pink)' },
} as const

export type ColourId = keyof typeof COLOURS
export const COLOUR_IDS = Object.keys(COLOURS) as ColourId[]

export type PaletteId = 'mono' | 'trio'
export const PALETTES: Option<PaletteId>[] = [
  { id: 'mono', label: 'One colour', note: 'The whole name in the lamp colour.' },
  { id: 'trio', label: 'Brand trio', note: 'One brand colour per word: pink, blue, green.' },
]

/** Per-word colours for each palette. One colour uses the lamp colour. */
export const PALETTE_WORDS: Record<PaletteId, string[] | undefined> = {
  mono: undefined,
  trio: ['var(--brand-pink)', '#4d8cff', 'var(--brand-green)'],
}

export type GlowId = 'none' | 'soft' | 'bloom'
export const GLOWS: Option<GlowId>[] = [
  { id: 'none', label: 'Flat', note: 'Today’s wordmark: lit lamps, no light around them.' },
  { id: 'soft', label: 'Soft', note: 'A tight halo, as if the board sits behind smoked acrylic.' },
  { id: 'bloom', label: 'Bloom', note: 'A wide halo that spills across the gaps between letters.' },
]

export type LoadId = 'none' | 'sweep' | 'strike' | 'raster' | 'random' | 'cycle' | 'marquee' | 'rgb'
export const LOADS: Option<LoadId>[] = [
  { id: 'none', label: 'None', note: 'The name is simply there.' },
  { id: 'sweep', label: 'Sweep', note: 'Today’s load: lamps step on column by column.' },
  {
    id: 'strike',
    label: 'Power-on',
    note: 'The whole board, ghosts too, flickers like a fluorescent tube striking, then holds.',
  },
  {
    id: 'raster',
    label: 'Raster',
    note: 'A scan column crosses the ghost grid; each lamp it passes ignites white-hot and cools to its colour.',
  },
  { id: 'random', label: 'Resolve', note: 'Lamps ignite in a scattered order until the name resolves.' },
  {
    id: 'cycle',
    label: 'Glyph cycle',
    note: 'Each letter spins through random characters before locking, left to right: the split-flap ripple on lamps.',
    ref: { name: 'FREITAG', url: 'https://mobbin.com/sites/sections/e4bb7848-25ac-40bd-9669-d8abf35b983c' },
  },
  {
    id: 'marquee',
    label: 'Marquee',
    note: 'WELCOME ABOARD scrolls through in whole-lamp steps, holds, then the name scrolls in and locks.',
  },
  {
    id: 'rgb',
    label: 'RGB converge',
    note: 'Pink, blue and green copies slide together from a lamp apart into the name.',
    ref: { name: 'Unseen Studio', url: 'https://mobbin.com/sites/sections/64611226-7921-4e34-9001-83c7e91bd803' },
  },
]

export type HoverId = 'relight' | 'torch' | 'ripple' | 'trail' | 'flick'
export const HOVERS: Option<HoverId>[] = [
  { id: 'relight', label: 'Relight', note: 'Today’s hover: the letter re-lights column by column.' },
  { id: 'torch', label: 'Torch', note: 'Lamps near the pointer flare and the ghost grid glows around it. Best with a glow on.' },
  { id: 'ripple', label: 'Ripple', note: 'A pulse runs outward from the letter through every lamp on the board, dark ones too.' },
  { id: 'trail', label: 'Colour trail', note: 'Each letter you cross takes the next brand colour and fades back.' },
  {
    id: 'flick',
    label: 'Glyph flick',
    note: 'The letter ticks through a few random characters and back.',
    ref: { name: 'KODE Immersive', url: 'https://mobbin.com/sites/sections/2a059cce-8c42-4096-b74a-0ddf77e3e7d3' },
  },
]

export type LeanId = 'none' | 'italic' | 'bold'
export const LEANS: Option<LeanId>[] = [
  { id: 'none', label: 'Regular', note: 'Letters keep their weight under the pointer.' },
  { id: 'italic', label: 'Italic', note: 'The letter under the pointer shears right, whole lamps at a time.' },
  { id: 'bold', label: 'Bold', note: 'The letter double-strikes: each lit lamp lights its right neighbour.' },
]

export type ClickId =
  | 'none'
  | 'surprise'
  | 'plane'
  | 'shockwave'
  | 'pattern'
  | 'wave'
  | 'depart'
  | 'scatter'
  | 'fireworks'
  | 'barcode'
  | 'invert'
  | 'message'
  | 'flash'
  | 'colour'
export const CLICKS: Option<ClickId>[] = [
  { id: 'none', label: 'None', note: 'Clicking does nothing.' },
  { id: 'surprise', label: 'Surprise me', note: 'Each click plays a different one of the effects below, at random.' },
  {
    id: 'plane',
    label: 'Plane',
    note: 'A lamp-drawn plane takes off from the row you clicked, climbs across the board and leaves a pink/blue/green contrail that fades. The letters go dark round its outline as it passes.',
  },
  {
    id: 'shockwave',
    label: 'Shockwave',
    note: 'Rings expand from where you clicked, pink then blue then green, lighting dark lamps as they pass and flaring the letters.',
  },
  {
    id: 'pattern',
    label: 'Brand grid',
    note: 'A diagonal wipe turns the board into the footer’s pixel grid (B.P..GB.), holds, then wipes back to the name.',
  },
  { id: 'wave', label: 'Wave', note: 'The letters ride a wave left to right, lifting whole lamps off the grid, then settle.' },
  {
    id: 'depart',
    label: 'Depart',
    note: 'The name departs: lamps drop off the bottom column by column, then fall back in from above and land with a bounce.',
  },
  { id: 'scatter', label: 'Scatter', note: 'Lamps burst away from the click in brand colours, then snap back home.' },
  { id: 'fireworks', label: 'Fireworks', note: 'Three rockets rise past the name and burst above it in pink, blue and green.' },
  {
    id: 'barcode',
    label: 'Barcode',
    note: 'The board becomes the name’s barcode (the same bars as the boarding passes), a scan line reads it, it flashes green to accept, then wipes back.',
  },
  { id: 'invert', label: 'Invert', note: 'A stepped wipe swaps lit and dark lamps, holds the name in negative, then wipes back.' },
  {
    id: 'message',
    label: 'Message',
    note: 'The name scrolls off and a line scrolls through — NOW BOARDING, GATE 01A, the time in New York — then back.',
  },
  { id: 'flash', label: 'Overload', note: 'The board flashes white like a camera and the light decays back.' },
  { id: 'colour', label: 'Colour cycle', note: 'Each click relamps the board in the next colour, kept for next visit.' },
]

/** What Surprise me picks from. */
export const SURPRISES: ClickId[] = [
  'plane',
  'shockwave',
  'pattern',
  'wave',
  'depart',
  'scatter',
  'fireworks',
  'barcode',
  'invert',
  'message',
  'flash',
]

export type AmbientId =
  | 'breathe'
  | 'twinkle'
  | 'scan'
  | 'refresh'
  | 'drift'
  | 'glint'
  | 'life'
  | 'rain'
  | 'rotate'
  | 'buzz'
  | 'size'
export const AMBIENTS: Option<AmbientId>[] = [
  { id: 'breathe', label: 'Breathing', note: 'The halo swells and fades in a slow wave along the name. Needs a glow.' },
  { id: 'twinkle', label: 'Twinkle', note: 'Dark lamps glint faintly in brand colours, a few at a time.' },
  {
    id: 'scan',
    label: 'Scanline',
    note: 'Every eight seconds or so a bright column drifts across: dark lamps glow and the letters flare as it passes.',
  },
  { id: 'refresh', label: 'Tile refresh', note: 'Every few seconds one letter ticks through a few glyphs and relocks, like a board updating.' },
  { id: 'drift', label: 'Colour drift', note: 'Bands of pink, blue and green roll slowly through the name.' },
  { id: 'glint', label: 'Glass glint', note: 'A soft sheen slides across the board now and then, as if it sits behind glass.' },
  {
    id: 'life',
    label: 'Ghost life',
    note: 'A slow, dim Game of Life plays out in the dark lamps behind the name; the letters are walls.',
  },
  { id: 'rain', label: 'Rain', note: 'Dim drops run down the dark lamps, passing behind the letters.' },
  {
    id: 'rotate',
    label: 'Rotation',
    note: 'Leave the pointer still for twelve seconds and the board rotates through its info lines, like a real departures board, then returns to the name.',
  },
  { id: 'buzz', label: 'Failing bulb', note: 'Every few seconds one letter buzzes like a tired lamp.' },
  { id: 'size', label: 'Lamp wave', note: 'A slow wave of lamp size rolls through the name.' },
]

export type SceneId = 'core' | 'decay' | 'field' | 'spill' | 'boot' | 'lightbox'
export const SCENES: Option<SceneId>[] = [
  { id: 'core', label: 'Hot core', note: 'Lit lamps burn near-white with a coloured rim, like real bulbs. Shows on coloured lamps.' },
  { id: 'decay', label: 'Afterglow', note: 'Lamps fade out instead of snapping off, wherever letters change.' },
  {
    id: 'field',
    label: 'Board field',
    note: 'The ghost grid carries on past the name and fades out; stray lamps blink on in brand colours.',
    ref: { name: 'Base', url: 'https://mobbin.com/sites/sections/87e73f15-c33e-4182-977e-41c71a0f2d3a' },
  },
  {
    id: 'spill',
    label: 'Light spill',
    note: 'A pool of the lamp colour lights the surface under the board.',
    ref: { name: 'Nike After Dark', url: 'https://mobbin.com/sites/sections/a7d81051-1ae6-44b0-8069-adebc2aff07f' },
  },
  {
    id: 'boot',
    label: 'Boot log',
    note: 'Two status lines type out before the board loads.',
    ref: { name: 'Render', url: 'https://mobbin.com/screens/e0a1a3a2-c54c-4f35-a17b-5a34082e6fa0' },
  },
  {
    id: 'lightbox',
    label: 'Lightbox',
    note: 'A backlit panel behind the name, lit through vertical tube stripes like a shopfront sign box.',
  },
]

/** How long each load runs before ambient effects may start, in ms (before the boot log). */
export const LOAD_MS: Record<LoadId, number> = {
  none: 0,
  sweep: 1500,
  strike: 1400,
  raster: 1800,
  random: 1400,
  cycle: 1700,
  marquee: 4300,
  rgb: 1300,
}

export const BOOT_MS = 1300

export type LabState = {
  palette: PaletteId
  glow: GlowId
  colour: ColourId
  load: LoadId
  hover: HoverId[]
  lean: LeanId
  click: ClickId
  ambient: AmbientId[]
  scene: SceneId[]
}

/** The settings the homepage wordmark ships with (components/brand/led-wordmark). */
export const DEFAULTS: LabState = {
  palette: 'mono',
  glow: 'none',
  colour: 'blue',
  load: 'random',
  hover: ['trail', 'flick'],
  lean: 'none',
  click: 'barcode',
  ambient: ['refresh', 'buzz'],
  scene: ['field', 'spill'],
}
