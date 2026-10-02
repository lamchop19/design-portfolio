import Link from 'next/link'

import { LiveClock } from '@/components/brand/live-clock'
import { WindowShade } from '@/components/layout/window-shade'
import { FlapText } from '@/components/split-flap/split-flap'

const nav = [
  { label: 'Departures', href: '#work' },
  { label: 'Contact', href: '#contact' },
] as const

/** Layout A's top line: clock, location, page links and the theme control, three columns each. */
export function MetaStrip({ count }: { count: number }) {
  return (
    <div className="swiss-grid t-label rule-draw rule-draw-bottom items-baseline py-4">
      <LiveClock className="col-span-2 md:col-span-3" />
      <FlapText
        text="40.73°N 73.99°W"
        className="hidden text-ink-faint md:col-span-3 md:block"
        intro="quick"
        delay={0}
      />
      <nav className="hidden gap-6 md:col-span-3 md:flex">
        {nav.map((item, i) => (
          <a key={item.href} href={item.href} className="transition-colors hover:text-accent">
            <FlapText
              text={item.href === '#work' ? `${item.label} (${String(count).padStart(2, '0')})` : item.label}
              intro="quick"
              delay={80 + i * 80}
              ripple
            />
          </a>
        ))}
        <Link href="/scraps" transitionTypes={['nav-forward']} className="transition-colors hover:text-accent">
          <FlapText text="Scraps" intro="quick" delay={240} ripple />
        </Link>
      </nav>
      <div className="col-span-2 justify-self-end md:col-span-3">
        <WindowShade inline />
      </div>
    </div>
  )
}
