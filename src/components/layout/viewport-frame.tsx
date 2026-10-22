'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { LiveClock } from '@/components/brand/live-clock'
import type { HoverId } from '@/components/brand/logo/effects'
import { LogoMark } from '@/components/brand/logo/logo-mark'
import { isHome } from '@/lib/paths'
import { site } from '@/../content/site'

import './viewport-frame.css'

/** Marc's picks from /prototypes/logo, set off by pointing anywhere on the pill. */
const MARK_HOVERS: HoverId[] = ['sweep', 'boil', 'shift']

/**
 * The window's frame (after Anima): a hairline just inside the viewport with
 * heavier corner brackets, two pills at the top (the maL mark and the name,
 * back to the top or home, and Contact) and small facts along the bottom
 * edge. Fixed, so the page scrolls under it. `mark` is the monogram's markup
 * (logoSvg, read in the layout); the homepage intro lands in it.
 */
export function ViewportFrame({ mark }: { mark: string }) {
  const home = isHome(usePathname())
  const name = (
    <>
      <LogoMark svg={mark} hovers={MARK_HOVERS} hoverScope=".vf-pill" className="vf-mark" />
      <span>{site.name}</span>
    </>
  )

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
          <a href="#top" className="vf-pill vf-pill-mark t-label">
            {name}
          </a>
        ) : (
          <Link href="/" transitionTypes={['nav-back']} className="vf-pill vf-pill-mark t-label">
            {name}
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
