'use client'

import { Fragment } from 'react'

import { MARK_HOVERS } from '@/components/brand/logo/effects'
import { LogoMark } from '@/components/brand/logo/logo-mark'
import { GridOverlay } from '@/components/layout/grid-overlay'
import { SceneSelector } from '@/components/scenes/scene-selector'
import type { SectionId } from '@/lib/guide'
import type { SceneChoice } from '@/lib/scene-choice'
import { site } from '@/../content/site'

import { ChannelWord } from './channel-word'
import { guideFont } from './fonts'
import { GuideMenu } from './guide-menu'
import { GUIDE_LOOK, type GuideLook } from './look'
import type { SectionPreview } from './previews'

import './guide.css'

/** Words between ** are set heavier, and hyphenated words ("life-long") don't break at the hyphen. */
const emphasis = (text: string) =>
  text.split('**').map((part, i) => {
    const words = part.split(/(\S+-\S+)/).map((word, j) => (j % 2 ? <span key={j} className="whitespace-nowrap">{word}</span> : word))
    return i % 2 ? <strong key={i}>{words}</strong> : <Fragment key={i}>{words}</Fragment>
  })

/**
 * The homepage as a TV guide's main menu, from Marc's "new layout"
 * wireframe: the maL mark, the sentence about Marc ending on a word that
 * changes, the four sections as a typographic menu, and the boxes that
 * change the painted scene behind it all (components/scenes). One screen;
 * the sections open screens of their own. The parts are the same in every
 * layout and sit on the site's 12-column grid, so `look.layout` only moves
 * them (guide.css). G draws the grid. The intro lands on the mark
 * (.guide-logo), and the rest settles up as it does.
 */
export function GuideLanding({
  logo,
  look = GUIDE_LOOK,
  previews,
  scenes,
}: {
  /** The monogram's markup (logoSvg, read on the server). */
  logo: string
  look?: GuideLook
  /** What each section holds, for the layouts that show it. */
  previews: Record<SectionId, SectionPreview>
  /** The scene boxes, if not the site's. */
  scenes?: SceneChoice[]
}) {
  const column = look.layout === 'masthead' || look.layout === 'channel'

  return (
    <div
      className={`guide guide-landing ${guideFont.variable}`}
      data-layout={look.layout}
      data-type={look.type}
      data-ink={look.ink}
      data-highlight={look.highlight}
    >
      <h1 className="guide-mast">
        <LogoMark svg={logo} hovers={MARK_HOVERS} label={site.name} className="guide-logo" />
      </h1>

      <p className="guide-bio mal-intro-settle">
        {emphasis(site.intro)} <ChannelWord words={site.interests} />.
      </p>

      <div className="guide-menu mal-intro-settle">
        <GuideMenu key={look.layout} layout={look.layout} previews={previews} />
      </div>

      <div className="guide-scenes mal-intro-settle">
        <SceneSelector choices={scenes} axis={column ? 'column' : 'row'} />
      </div>

      <GridOverlay />
    </div>
  )
}
