import Link from 'next/link'
import { ViewTransition } from 'react'

import { MARK_HOVERS } from '@/components/brand/logo/effects'
import { LogoMark } from '@/components/brand/logo/logo-mark'
import { logoSvg } from '@/components/brand/logo/source'
import { SceneSelector } from '@/components/scenes/scene-selector'
import { GUIDE_SECTIONS, type SectionId } from '@/lib/guide'

import { guideFont } from './fonts'
import { GUIDE_LOOK } from './look'

import './guide.css'

/**
 * A screen the guide's menu opens. For now a plain page under a header of the
 * mark and the four sections; the Sky Guide screen (the menu as a header, a
 * numbered list with the highlight and a panel previewing the row in focus)
 * replaces it once the landing's layout is settled.
 */
export function GuideScreen({ section, children }: { section: SectionId; children: React.ReactNode }) {
  const here = GUIDE_SECTIONS.find((s) => s.id === section)!

  return (
    <ViewTransition
      enter={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
      exit={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
      default="none"
    >
      <div
        className={`guide guide-screen ${guideFont.variable}`}
        data-type={GUIDE_LOOK.type}
        data-ink={GUIDE_LOOK.ink}
        data-highlight={GUIDE_LOOK.highlight}
      >
        <header className="guide-head">
          <Link href="/" transitionTypes={['nav-back']} className="guide-head-home" aria-label="Main menu">
            <LogoMark svg={logoSvg('blue', { ns: 'mal-screen', monogram: true })} hovers={MARK_HOVERS} className="guide-head-logo" />
          </Link>
          <nav aria-label="Sections" className="guide-head-nav">
            {GUIDE_SECTIONS.map((s) => (
              <Link key={s.id} href={s.href} aria-current={s.id === section ? 'page' : undefined} transitionTypes={['nav-forward']}>
                {s.label}
              </Link>
            ))}
          </nav>
        </header>
        <h1 className="guide-screen-title">{here.label}</h1>
        <div className="guide-screen-body">{children}</div>
        <div className="guide-screen-scenes">
          <SceneSelector axis="row" />
        </div>
      </div>
    </ViewTransition>
  )
}
