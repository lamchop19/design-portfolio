'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { MARK_HOVERS } from '@/components/brand/logo/effects'
import { LogoMark } from '@/components/brand/logo/logo-mark'
import { isGuide } from '@/lib/paths'
import { site } from '@/../content/site'

import './viewport-frame.css'

/**
 * Two pills at the top of the window (after Anima): the maL mark and the
 * name, home; and Contact, which lives in About. Fixed, so the page scrolls
 * under them. The guide's screens draw their own mark and menu, so there the
 * pills step aside. `mark` is the monogram's markup (logoSvg, read in the
 * layout).
 */
export function ViewportFrame({ mark }: { mark: string }) {
  if (isGuide(usePathname())) return null

  return (
    <nav className="vf-nav" aria-label="Site">
      <Link href="/" transitionTypes={['nav-back']} className="vf-pill vf-pill-mark t-label">
        <LogoMark svg={mark} hovers={MARK_HOVERS} hoverScope=".vf-pill" className="vf-mark" />
        <span>{site.name}</span>
      </Link>
      <Link href="/about" transitionTypes={['nav-forward']} className="vf-pill vf-pill-split t-label">
        <span>Contact</span>
        <span className="vf-plus" aria-hidden="true">
          +
        </span>
      </Link>
    </nav>
  )
}
