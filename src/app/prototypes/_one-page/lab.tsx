'use client'

import { useState } from 'react'

import { GridOverlay } from '@/components/layout/grid-overlay'
import type { WorkItem } from '@/lib/work-items'

import { AIR_PICKS, FLORA_PICKS } from '@/components/flora/flora'

import { FORMATS, type FormatId } from './formats'

import '../_panel/panel.css'
import './one-page.css'

type Palette = 'two' | 'full' | 'air'

/**
 * The portfolio on one screen, four ways, with the folk-plant flora in riso
 * (two-ink or full palette) or airbrushed, optionally on a pastel ground.
 * All static. The panel folds away to judge a format clean; G draws
 * the grid.
 */
export function OnePageLab({ items }: { items: WorkItem[] }) {
  const [format, setFormat] = useState<FormatId>('index')
  const [palette, setPalette] = useState<Palette>('two')
  const [flora, setFlora] = useState(true)
  const [ground, setGround] = useState(false)
  const [folded, setFolded] = useState(false)
  const current = FORMATS.find((f) => f.id === format)!
  const Format = current.Component

  return (
    <div data-palette={palette} data-flora={flora ? undefined : 'off'} data-ground={ground ? 'pastel' : undefined}>
      <Format items={items} picks={palette === 'air' ? AIR_PICKS : FLORA_PICKS} />
      <GridOverlay />

      <aside className="hl-panel hl-corner op-panel" aria-label="One-page options" data-folded={folded || undefined}>
        <div className="hl-options" role="radiogroup" aria-label="Format">
          {FORMATS.map((option) => (
            <button key={option.id} type="button" role="radio" aria-checked={option.id === format} className="hl-chip" onClick={() => setFormat(option.id)}>
              {option.name}
            </button>
          ))}
          <button type="button" className="hl-chip hl-fold" onClick={() => setFolded((f) => !f)} aria-expanded={!folded}>
            {folded ? 'Formats' : 'Hide'}
          </button>
        </div>
        <div className="hl-options" role="radiogroup" aria-label="Flora palette">
          <button type="button" role="radio" aria-checked={palette === 'two'} className="hl-chip" onClick={() => setPalette('two')}>
            Two-ink riso
          </button>
          <button type="button" role="radio" aria-checked={palette === 'full'} className="hl-chip" onClick={() => setPalette('full')}>
            Full palette
          </button>
          <button type="button" role="radio" aria-checked={palette === 'air'} className="hl-chip" onClick={() => setPalette('air')}>
            Airbrush
          </button>
          <button type="button" role="switch" aria-checked={flora} className="hl-chip" onClick={() => setFlora((f) => !f)}>
            Flora {flora ? 'on' : 'off'}
          </button>
          <button type="button" role="switch" aria-checked={ground} className="hl-chip" onClick={() => setGround((g) => !g)}>
            Pastel ground
          </button>
        </div>
        <p className="hl-note">{current.note}</p>
      </aside>
    </div>
  )
}
