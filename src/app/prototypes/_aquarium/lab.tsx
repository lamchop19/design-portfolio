'use client'

import { useState } from 'react'

import type { WorkItem } from '@/lib/work-items'

import { LAYOUTS, type LayoutId } from './layouts'

import '../_panel/panel.css'
import './aquarium.css'

/** The aquarium scene behind the portfolio, three ways. The panel folds away to judge a layout clean. */
export function AquariumLab({ items }: { items: WorkItem[] }) {
  const [layout, setLayout] = useState<LayoutId>('centred')
  const [folded, setFolded] = useState(false)
  const current = LAYOUTS.find((l) => l.id === layout)!
  const Layout = current.Component

  return (
    <>
      <Layout items={items} />
      <aside className="hl-panel hl-corner aq-lab-panel" aria-label="Aquarium layouts" data-folded={folded || undefined}>
        <div className="hl-options" role="radiogroup" aria-label="Layout">
          {LAYOUTS.map((option) => (
            <button key={option.id} type="button" role="radio" aria-checked={option.id === layout} className="hl-chip" onClick={() => setLayout(option.id)}>
              {option.name}
            </button>
          ))}
          <button type="button" className="hl-chip hl-fold" onClick={() => setFolded((f) => !f)} aria-expanded={!folded}>
            {folded ? 'Layouts' : 'Hide'}
          </button>
        </div>
        <p className="hl-note">{current.note}</p>
      </aside>
    </>
  )
}
