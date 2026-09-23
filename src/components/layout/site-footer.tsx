import Link from 'next/link'

import { site } from '@/../content/site'

/**
 * The site's only persistent navigation. It carries `view-transition-name:
 * site-footer` so it stays pinned while page content slides underneath it —
 * see the ::view-transition-group(site-footer) rules in globals.css.
 */
export function SiteFooter() {
  return (
    <footer
      style={{ viewTransitionName: 'site-footer' }}
      className="border-t border-rule px-(--page-margin) py-8"
    >
      <nav className="flex flex-wrap items-baseline gap-x-8 gap-y-3 font-mono text-xs tracking-wide uppercase">
        <Link href="/" transitionTypes={['nav-back']} className="text-ink hover:text-accent">
          Index
        </Link>
        <Link
          href="/scraps"
          transitionTypes={['nav-forward']}
          className="text-ink-muted hover:text-accent"
        >
          Scraps
        </Link>
        <span className="flex-1" />
        {site.links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target={link.href.startsWith('mailto:') ? undefined : '_blank'}
            rel="noreferrer"
            className="text-ink-muted hover:text-accent"
          >
            {link.label}
          </a>
        ))}
      </nav>
    </footer>
  )
}
