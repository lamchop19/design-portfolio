'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { LiveClock } from '@/components/brand/live-clock'
import { isHome } from '@/lib/paths'
import { site } from '@/../content/site'

import './viewport-frame.css'

/**
 * The window's frame (after Anima): a hairline just inside the viewport with
 * heavier corner brackets, two pills at the top (the name, back to the top or
 * home, and Contact) and small facts along the bottom edge. Fixed, so the
 * page scrolls under it.
 */
export function ViewportFrame() {
  const home = isHome(usePathname())

  return (
    <>
      <div className="vf" aria-hidden="true">
        <span className="vf-corner" data-corner="tl" />
        <span className="vf-corner" data-corner="tr" />
        <span className="vf-corner" data-corner="bl" />
        <span className="vf-corner" data-corner="br" />
      </div>

      <nav className="vf-nav" aria-label="Site">
        {home ? (
          <a href="#top" className="vf-pill t-label">
            {site.name}
          </a>
        ) : (
          <Link href="/" transitionTypes={['nav-back']} className="vf-pill t-label">
            {site.name}
          </Link>
        )}
        <a href={home ? '#contact' : '/#contact'} className="vf-pill vf-pill-split t-label">
          <span>Contact</span>
          <span className="vf-plus" aria-hidden="true">
            +
          </span>
        </a>
      </nav>

      <div className="vf-foot t-label">
        <span>40.7128° N, 74.0060° W</span>
        <LiveClock />
      </div>
    </>
  )
}
