/**
 * The homepage as a flight: its sections ("legs") in order. Each leg has a sky
 * colour, `--leg-<id>` (light and dark in landing.css), which the page's one
 * continuous sky fades between; `legClass` sets the ink and surface tokens
 * that read on it.
 */
export const legs = [
  { id: 'gate', no: '01', code: 'Gate', section: 'Landing' },
  { id: 'departures', no: '02', code: 'Takeoff', section: 'Work' },
  { id: 'cruise', no: '03', code: 'Cruise', section: 'About' },
  { id: 'layover', no: '04', code: 'Layover', section: 'Experience' },
  { id: 'arrival', no: '05', code: 'Arrival', section: 'Contact' },
] as const

export type Leg = (typeof legs)[number]
export type LegId = Leg['id']

export const legClass = (id: LegId) => `leg leg-${id}`

/** The leg's sky colour, as a CSS value. */
export const sky = (id: LegId) => `var(--leg-${id})`

/**
 * One headline result per project, shown under its cover.
 * TODO(content): add the other projects' numbers as they come in.
 */
export const results: Record<string, string> = {
  'startup-week': '20K+ reel views',
}

/** Roles for the layover leg, newest first. */
export const roles = [
  { org: 'tech@nyu', role: 'Vice President', when: '2025', stamp: 'VP' },
  { org: 'tech@nyu', role: 'Marketing Lead', when: 'Jan 2025', stamp: 'MKTG' },
  { org: 'NYU Sydney', role: 'Intercultural Learning Fellow', when: 'Oct 2025', stamp: 'SYD' },
  { org: 'Shmeel NYC', role: 'Designer', when: 'May 2024', stamp: 'SHM' },
]
