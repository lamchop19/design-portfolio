import { FlapText } from '@/components/split-flap/split-flap'
import { asset } from '@/lib/paths'
import { site } from '@/../content/site'

/**
 * The page's closing block: a large email address, then a single line of
 * links and credits. `number` is the section number shown in its label.
 */
export function Colophon({ number, className }: { number: string; className?: string }) {
  return (
    <footer id="contact" className={['rule-draw grid grid-cols-subgrid', className].filter(Boolean).join(' ')} data-scroll>
      <FlapText
        text={`${number} — Final call`}
        className="t-label col-span-full pt-4 text-ink-faint md:col-span-3"
        trigger="visible"
        intro="quick"
      />
      <a
        href={`mailto:${site.email}`}
        className="col-span-full pt-4 text-[clamp(1.75rem,4.4vw,4rem)] leading-[1.1] font-medium tracking-[-0.03em] break-all transition-colors hover:text-accent md:col-span-9"
      >
        {site.email}
      </a>
      <div className="t-label col-span-full mt-24 grid grid-cols-subgrid gap-y-2 pb-20 md:pb-6">
        <p className="col-span-2 text-ink-faint md:col-span-3">Operated by {site.name}</p>
        <ul className="col-span-2 flex gap-4 md:col-span-3">
          {site.links.map((link) => (
            <li key={link.label}>
              <a
                href={link.kind === 'asset' ? asset(link.href) : link.href}
                {...(link.kind === 'external' ? { target: '_blank', rel: 'noreferrer' } : {})}
                className="transition-colors hover:text-accent"
              >
                {link.label} ↗
              </a>
            </li>
          ))}
        </ul>
        <p className="col-span-2 text-ink-faint md:col-span-3">© {new Date().getFullYear()} · Set in Geist</p>
        <a href="#top" className="col-span-2 transition-colors hover:text-accent md:col-span-3 md:text-right">
          Return to gate ↑
        </a>
      </div>
    </footer>
  )
}
