'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

import { RuledIndex } from '@/components/home/ruled-index'
import type { WorkItem } from '@/lib/work-items'

import { BottomMenu, MarginIndex, RuledStrip, SegmentedPill } from './navs'
import { NAV_STYLES, type NavStyleId } from './options'

import '../_panel/panel.css'
import './nav.css'

const navs: Record<NavStyleId, () => React.ReactNode> = {
  strip: RuledStrip,
  pill: SegmentedPill,
  margin: MarginIndex,
  menu: BottomMenu,
}

/**
 * The ruled-index homepage with its top nav switchable. ?style= opens straight
 * onto one, for sharing and screenshots. The panel folds away to a chip so it
 * never sits on the nav being judged.
 */
export function NavLab({ items }: { items: WorkItem[] }) {
  const params = useSearchParams()
  const [style, setStyle] = useState<NavStyleId>(
    () => NAV_STYLES.find((s) => s.id === params.get('style'))?.id ?? 'strip',
  )
  const [folded, setFolded] = useState(false)
  const current = NAV_STYLES.find((s) => s.id === style)!
  const Nav = navs[style]

  const choose = (id: NavStyleId) => {
    setStyle(id)
    const url = new URL(window.location.href)
    url.searchParams.set('style', id)
    window.history.replaceState(null, '', url)
  }

  return (
    <div data-nav-style={style}>
      <RuledIndex key={style} items={items} nav={<Nav />} />

      <aside className="hl-panel hl-corner" aria-label="Nav style" data-folded={folded || undefined}>
        <div className="hl-options" role="radiogroup" aria-label="Nav style">
          {NAV_STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={s.id === style}
              className="hl-chip"
              onClick={() => choose(s.id)}
            >
              {s.name}
            </button>
          ))}
          <button type="button" className="hl-chip hl-fold" onClick={() => setFolded((f) => !f)} aria-expanded={!folded}>
            {folded ? 'Styles' : 'Hide'}
          </button>
        </div>
        <p className="hl-note">{current.note}</p>
        <p className="hl-note">
          {current.refs.map((ref, i) => (
            <span key={ref.url}>
              {i > 0 ? ' · ' : null}
              <a href={ref.url} target="_blank" rel="noreferrer" className="underline-offset-2 hover:text-accent hover:underline">
                {ref.name} ↗
              </a>
            </span>
          ))}
        </p>
      </aside>
    </div>
  )
}
