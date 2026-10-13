/** What the lab dock can switch, with where each idea came from. */

export type TypeId = 'current' | 'cockpit' | 'highway' | 'hyperlegible' | 'dot-matrix' | 'editorial'
export type MotionId = 'current' | 'editorial' | 'mechanical' | 'spring'
export type MicroId = 'decode' | 'cursor' | 'magnetic' | 'highlights' | 'stretch' | 'scan' | 'stamp' | 'altimeter'

type Option<Id> = { id: Id; label: string; note: string; ref?: { name: string; url: string } }

const mobbin = (id: string) => `https://mobbin.com/sites/sections/${id}`

export const TYPE_OPTIONS: Option<TypeId>[] = [
  { id: 'current', label: 'Current', note: 'Geist and Geist Mono, as live' },
  { id: 'cockpit', label: 'Cockpit', note: 'B612, drawn for Airbus cockpit screens' },
  { id: 'highway', label: 'Highway', note: 'Overpass, from the US highway-sign lineage' },
  { id: 'hyperlegible', label: 'Hyperlegible', note: 'Atkinson Hyperlegible, built for low vision' },
  {
    id: 'dot-matrix',
    label: 'Dot matrix',
    note: 'A dot face on the wordmark and boards only; labels stay crisp',
    ref: { name: 'FREITAG', url: mobbin('cac5c6fe-01b5-4769-8972-a2d70c190673') },
  },
  {
    id: 'editorial',
    label: 'Editorial',
    note: 'Instrument Serif headings over Geist',
    ref: { name: 'Freshman', url: mobbin('cc46fe95-d2fb-46a6-927a-96c9bc6d5ecc') },
  },
]

export const MOTION_OPTIONS: Option<MotionId>[] = [
  { id: 'current', label: 'Current', note: 'The live motion, untouched' },
  { id: 'editorial', label: 'Editorial reveal', note: 'Native scroll-driven CSS: lines rise and unmask' },
  { id: 'mechanical', label: 'Mechanical', note: 'Every transition ticks in steps, like the board' },
  { id: 'spring', label: 'Spring', note: 'Motion library: springy hovers, staggered entrances' },
]

export const MICRO_OPTIONS: Option<MicroId>[] = [
  {
    id: 'decode',
    label: 'Departure decode',
    note: 'Headings and links scramble, then settle',
    ref: { name: 'KODE Immersive', url: mobbin('2a059cce-8c42-4096-b74a-0ddf77e3e7d3') },
  },
  {
    id: 'cursor',
    label: 'Boarding cursor',
    note: 'A pill cursor names the flight you’re over',
    ref: { name: 'Framer', url: mobbin('e6098968-5b01-4b77-87f9-a8ab11f1c92c') },
  },
  { id: 'magnetic', label: 'Magnetic plates', note: 'Sign plates and buttons lean toward the pointer' },
  {
    id: 'highlights',
    label: 'Marker highlights',
    note: 'Key phrases light up as they scroll in',
    ref: { name: 'Deta', url: mobbin('732d4d26-12e6-49af-a48b-7e9571d7bb2c') },
  },
  { id: 'stretch', label: 'Stretch headings', note: 'Bricolage widens and thickens on hover' },
  {
    id: 'scan',
    label: 'Scan line',
    note: 'Covers get scanned like a bag tag',
    ref: { name: 'FREITAG', url: mobbin('cac5c6fe-01b5-4769-8972-a2d70c190673') },
  },
  { id: 'stamp', label: 'Copy stamp', note: 'Clicking the email copies it and stamps the page' },
  { id: 'altimeter', label: 'Altimeter', note: 'Scroll depth read out as altitude' },
]

/** Which dot-matrix face the wordmark uses when the Dot matrix pairing is on (ids from _dots/variants). */
export type LabState = { type: TypeId; motion: MotionId; micro: MicroId[]; dot: string }

export const DEFAULT_STATE: LabState = { type: 'current', motion: 'current', micro: [], dot: 'bitcount-single-round' }
