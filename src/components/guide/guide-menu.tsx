'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { itemProps, useMenu } from '@/components/menu/use-menu'
import { GUIDE_SECTIONS, type SectionId } from '@/lib/guide'
import { indexLabel } from '@/lib/work-items'

import { ACROSS, type LayoutId } from './look'
import type { SectionPreview } from './previews'

/** How each layout numbers its items: 01, N°01 in the table, or a bare 1 as a superscript or a channel. */
function number(layout: LayoutId, i: number) {
  if (layout === 'table') return `N°${indexLabel(i)}`
  if (layout === 'split' || layout === 'channel') return String(i + 1)
  return indexLabel(i)
}

/**
 * The guide's four sections as type: a number, the label, and (where a
 * layout has room) what the section holds. The layout (guide.css) decides
 * how they sit. One square highlight glides to whatever is pointed at or
 * arrowed to, as on a TV guide, and Enter opens it.
 */
export function GuideMenu({ layout, previews }: { layout: LayoutId; previews: Record<SectionId, SectionPreview> }) {
  const { active, setActive, listProps, highlightRef } = useMenu(GUIDE_SECTIONS.length, ACROSS.includes(layout) ? 'horizontal' : 'vertical')
  // The highlight is placed before the first paint; it only glides from then on.
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <nav aria-label="Main menu" className="gm" data-ready={ready || undefined}>
      <div className="gm-list" {...listProps}>
        <span ref={highlightRef} className="gm-hl" aria-hidden="true" />
        {GUIDE_SECTIONS.map((section, i) => (
          <Link key={section.id} href={section.href} transitionTypes={['nav-forward']} className="gm-item" {...itemProps(i, active, setActive)}>
            <span className="gm-num" aria-hidden="true">
              {number(layout, i)}
            </span>
            <span className="gm-label">{section.label}</span>
            <span className="gm-meta" aria-hidden="true">
              {previews[section.id].meta}
            </span>
            <span className="gm-items" aria-hidden="true">
              {previews[section.id].items}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
