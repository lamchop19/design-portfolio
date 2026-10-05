/**
 * The Flight prototypes: the five legs of the trip, in order. Each leg is a
 * section of the page with its own solid sky, `--leg-<id>` (light and dark
 * versions in flight.css); `legClass` sets the ink and surface tokens that
 * read on it.
 */
export const legs = [
  { id: 'gate', no: '01', code: 'Gate', section: 'Landing', time: 'Morning' },
  { id: 'departures', no: '02', code: 'Takeoff', section: 'Work', time: 'Midday' },
  { id: 'cruise', no: '03', code: 'Cruise', section: 'About', time: 'Afternoon' },
  { id: 'layover', no: '04', code: 'Layover', section: 'Experience', time: 'Sunset' },
  { id: 'arrival', no: '05', code: 'Arrival', section: 'Contact', time: 'Night' },
] as const

export type Leg = (typeof legs)[number]
export type LegId = Leg['id']

export const legClass = (id: LegId) => `leg leg-${id}`

/** The leg's sky colour, as a CSS value. */
export const sky = (id: LegId) => `var(--leg-${id})`

/** Cruising altitude in feet: climb through takeoff, hold through cruise, descend through the layover. */
export function altitude(progress: number, stops: number[]) {
  const [, climb, cruise, descend, land] = stops
  const top = 36000
  if (progress <= climb) return 0
  if (progress < cruise) return top * ((progress - climb) / Math.max(cruise - climb, 1e-6))
  if (progress <= descend) return top
  return top * Math.max(0, 1 - (progress - descend) / Math.max(land - descend, 1e-6))
}

/**
 * One headline result per project, shown on its pass.
 * PLACEHOLDER: only Startup Week has a real number so far.
 */
export const results: Record<string, { value: string; placeholder?: boolean }> = {
  'tech-nyu': { value: '+XX% engagement', placeholder: true },
  'startup-week': { value: '20K+ reel views' },
  'nyu-sydney': { value: '+XX metric needed', placeholder: true },
  shmeel: { value: '+XX metric needed', placeholder: true },
}

/** Roles for the layover leg, newest first. */
export const roles = [
  { org: 'tech@nyu', role: 'Vice President', when: '2025', stamp: 'VP' },
  { org: 'tech@nyu', role: 'Marketing Lead', when: 'Jan 2025', stamp: 'MKTG' },
  { org: 'NYU Sydney', role: 'Intercultural Learning Fellow', when: 'Oct 2025', stamp: 'SYD' },
  { org: 'Shmeel NYC', role: 'Designer', when: 'May 2024', stamp: 'SHM' },
]

/** PLACEHOLDER: skills for the carry-on list, pulled from the case study tags. */
export const carryOn = ['Brand identity', 'Social strategy', 'Content', 'Editorial', 'Typography', 'Photography']
