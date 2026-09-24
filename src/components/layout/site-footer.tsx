import Link from 'next/link'

import { PixelGrid } from '@/components/brand/pixel-grid'
import { asset } from '@/lib/paths'
import { site } from '@/../content/site'

/**
 * The site's only persistent navigation, headed by the brand grid band.
 *
 * It carries `view-transition-name: site-footer` so it stays pinned while page
 * content slides underneath it — see ::view-transition-group(site-footer) in
 * globals.css.
 */
export function SiteFooter() {
  return (
    <footer style={{ viewTransitionName: 'site-footer' }} className="mt-[10vh]">
      <PixelGrid />
      <nav className="flex flex-wrap items-baseline gap-x-8 gap-y-3 px-(--page-margin) py-8 font-mono text-xs tracking-wide uppercase">
        <Link
          href="/"
          transitionTypes={['nav-back']}
          className="text-ink transition-colors hover:text-accent"
        >
          Index
        </Link>
        <Link
          href="/scraps"
          transitionTypes={['nav-forward']}
          className="text-ink-muted transition-colors hover:text-accent"
        >
          Scraps
        </Link>
        <span className="flex-1" />
        {site.links.map((link) => (
          <a
            key={link.label}
            href={link.kind === 'asset' ? asset(link.href) : link.href}
            target={link.kind === 'mail' ? undefined : '_blank'}
            rel="noreferrer"
            className="text-ink-muted transition-colors hover:text-accent"
          >
            {link.label}
          </a>
        ))}
      </nav>
    </footer>
  )
}
