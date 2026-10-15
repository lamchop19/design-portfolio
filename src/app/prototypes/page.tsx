import Link from 'next/link'

const prototypes = [
  { href: '/prototypes/bento-split', title: 'Bento — split terminal', note: 'Wordmark, belt and passport pinned left; the work scrolls on the right' },
  { href: '/prototypes/bento-board', title: 'Bento — departures board', note: 'The LED board on top, then one dense bento of work, passport and belt' },
  { href: '/prototypes/bento-intro', title: 'Bento — load intros', note: 'The departures board with a full-screen LED intro, baggage-drop and x-ray reveals' },
  { href: '/prototypes/bento-floorplan', title: 'Bento — floor plan', note: 'The terminal on one screen: gates per project, tiles open out over the plan' },
  { href: '/prototypes/passport', title: 'Passport — closed', note: 'Foil-stamped cover, open to meet the passenger' },
  { href: '/prototypes/passport-open', title: 'Passport — open', note: 'Identity spread, holographic details and experience stamps' },
  { href: '/prototypes/flight-vertical', title: 'The Flight — vertical', note: 'Stacked legs, hard cuts, rail down the right' },
  { href: '/prototypes/flight-signs', title: 'The Flight — signs', note: 'Wordmark docks on load, sign-plate nav, tagged covers' },
  { href: '/prototypes/flight-horizontal', title: 'The Flight — horizontal', note: 'Scroll down, fly sideways, skies crossfade' },
  { href: '/prototypes/flip', title: 'Flip lab', note: 'Wordmark flip curves and durations, side by side' },
  { href: '/prototypes/baggage-claim', title: 'Baggage claim', note: 'Footer belt from above: riso, pixel and line styles' },
  { href: '/prototypes/seatback', title: 'Seatback screen', note: 'The whole site as in-flight entertainment, remote included' },
  { href: '/prototypes/blacklight', title: 'Blacklight', note: 'A UV torch reveals process notes hidden under the passes' },
  { href: '/prototypes/tone-on-tone', title: 'Tone-on-tone', note: 'Each case study takes over the page in its own hue' },
  { href: '/prototypes/layout-timetable', title: 'Layout: timetable', note: 'Printed departures timetable, board or manifest' },
  { href: '/prototypes/layout-wayfinding', title: 'Layout: wayfinding', note: 'The page as a stack of airport sign bands' },
  { href: '/prototypes/layout-strips', title: 'Layout: flight strips', note: 'Air traffic control strip bay, one strip per project' },
  { href: '/prototypes/flight-home-lab', title: 'Home lab', note: 'The live homepage with switchable type, motion and micro-interactions' },
  { href: '/prototypes/dot-matrix', title: 'Dot-matrix wordmark', note: 'Eleven dot and LED treatments of the name at full size' },
  { href: '/prototypes/hero-load', title: 'Hero load', note: 'Four ways for the wordmark and baggage hall to arrive on load' },
  { href: '/prototypes/led-lab', title: 'LED lab', note: 'Glow, colour, load, hover and click treatments for the LED wordmark' },
  { href: '/prototypes/logo', title: 'Logo', note: 'MAL as a transit route, after the 1974 Greater Manchester Transport M' },
  { href: '/prototypes/grid-styles', title: 'Grid styles', note: 'Hanging margin, ruled index, modular field and staggered columns on the same content' },
  { href: '/prototypes/type-specimens', title: 'Type specimens', note: 'Six type pairings side by side on the same content' },
] as const

export default function PrototypesPage() {
  return (
    <div className="swiss-grid gap-y-8 py-16">
      <p className="t-label col-span-full text-ink-faint">Prototypes · not linked from the site</p>
      <ul className="col-span-full md:col-span-8">
        {prototypes.map((p) => (
          <li key={p.href} className="border-b border-rule">
            <Link href={p.href} className="flex items-baseline justify-between gap-6 py-5 transition-colors hover:text-accent">
              <span className="text-[32px] leading-10 font-medium tracking-[-0.02em]">{p.title}</span>
              <span className="t-label text-ink-faint">{p.note}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
