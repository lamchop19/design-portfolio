'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

import { RuledIndex } from '@/components/home/ruled-index'
import { GridOverlay } from '@/components/layout/grid-overlay'
import type { WorkItem } from '@/lib/work-items'

import { GRID_STYLES, type GridStyleId } from './options'
import { HangingMargin, ModularField, Staggered } from './styles'

import './grids.css'

const views: Record<GridStyleId, (props: { items: WorkItem[] }) => React.ReactNode> = {
  hang: HangingMargin,
  index: RuledIndex,
  field: ModularField,
  stagger: Staggered,
}

/**
 * Four Swiss grid layouts for the homepage, one at a time on the same content
 * and the same 12-column, 8px-baseline grid. ?style= opens straight onto one,
 * for sharing and screenshots; G (or Columns) draws the grid over the page.
 */
export function GridLab({ items }: { items: WorkItem[] }) {
  const params = useSearchParams()
  const [style, setStyle] = useState<GridStyleId>(
    () => GRID_STYLES.find((s) => s.id === params.get('style'))?.id ?? 'hang',
  )
  const current = GRID_STYLES.find((s) => s.id === style)!
  const View = views[style]

  const choose = (id: GridStyleId) => {
    setStyle(id)
    const url = new URL(window.location.href)
    url.searchParams.set('style', id)
    window.history.replaceState(null, '', url)
  }

  const toggleColumns = () => {
    const root = document.documentElement
    if ('grid' in root.dataset) delete root.dataset.grid
    else root.dataset.grid = ''
  }

  return (
    <>
      <nav aria-label="Grid styles" className="gs-bar swiss-grid t-label items-center gap-y-2">
        <ul className="col-span-full flex flex-wrap gap-x-5 gap-y-1 md:col-span-8">
          {GRID_STYLES.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                aria-pressed={s.id === style}
                onClick={() => choose(s.id)}
                className="gs-tab"
              >
                {s.name}
              </button>
            </li>
          ))}
        </ul>
        <div className="col-span-full flex flex-wrap items-center gap-x-4 gap-y-1 md:col-span-4 md:justify-end">
          {current.refs.map((ref) => (
            <a key={ref.url} href={ref.url} target="_blank" rel="noreferrer" className="text-ink-faint transition-colors hover:text-accent">
              {ref.name} ↗
            </a>
          ))}
          <button type="button" onClick={toggleColumns} className="gs-tab">
            Columns
          </button>
        </div>
      </nav>

      <div data-grid-style={style} className="gs-page">
        <View key={style} items={items} />
      </div>

      <GridOverlay />
    </>
  )
}
