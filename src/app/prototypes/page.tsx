import Link from 'next/link'

const prototypes = [
  { href: '/prototypes/flight-vertical', title: 'The Flight — vertical', note: 'Stacked legs, hard cuts, rail down the right' },
  { href: '/prototypes/flight-signs', title: 'The Flight — signs', note: 'Wordmark docks on load, sign-plate nav, tagged covers' },
  { href: '/prototypes/flight-horizontal', title: 'The Flight — horizontal', note: 'Scroll down, fly sideways, skies crossfade' },
  { href: '/prototypes/flip', title: 'Flip lab', note: 'Wordmark flip curves and durations, side by side' },
  { href: '/prototypes/baggage-claim', title: 'Baggage claim', note: 'Footer belt from above: riso, pixel and line styles' },
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
