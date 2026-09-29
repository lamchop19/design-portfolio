'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { PixelGrid } from '@/components/brand/pixel-grid'
import { OceanSeabed } from '@/components/brand/ocean-scenery'
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
  const isHome = usePathname() === '/'

  return (
    <footer style={{ viewTransitionName: 'site-footer' }} className={isHome ? 'site-footer-ocean' : 'mt-[10vh]'}>
      {isHome ? <OceanSeabed /> : <PixelGrid />}
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
