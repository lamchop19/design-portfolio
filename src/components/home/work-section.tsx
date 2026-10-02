'use client'

import { useSyncExternalStore } from 'react'

import { WorkIndex } from '@/components/home/work-index'
import { FlapText } from '@/components/split-flap/split-flap'
import { BoardingPass } from '@/components/work/boarding-pass'
import { WORK_VIEW_STORAGE_KEY, type WorkView } from '@/lib/work-view'
import type { WorkItem } from '@/lib/work-items'

function subscribe(onChange: () => void) {
  window.addEventListener('work-view-change', onChange)
  return () => window.removeEventListener('work-view-change', onChange)
}

const getView = (): WorkView => (document.documentElement.dataset.workView === 'passes' ? 'passes' : 'index')
const getServerView = (): WorkView => 'index'

function setView(view: WorkView) {
  document.documentElement.dataset.workView = view
  try {
    localStorage.setItem(WORK_VIEW_STORAGE_KEY, view)
  } catch {
    // The choice still holds for this visit when storage is blocked.
  }
  window.dispatchEvent(new Event('work-view-change'))
}

const views: Array<[WorkView, string]> = [
  ['index', 'Index'],
  ['passes', 'Passes'],
]

/**
 * The homepage work section: the numbered index table, or the same projects
 * as boarding passes. Both are rendered and CSS shows the chosen one (see
 * `.work-view-*` in globals.css), so the choice applies before hydration.
 */
export function WorkSection({ items }: { items: WorkItem[] }) {
  const view = useSyncExternalStore(subscribe, getView, getServerView)
  const years = items.map((item) => item.meta.year)

  return (
    <>
      <div className="t-label rule-draw col-span-full grid grid-cols-subgrid items-baseline pt-4" data-scroll>
        <h2 id="work-heading" className="col-span-2 md:col-span-3">
          <FlapText text="02 — Departures" className="text-ink-faint" trigger="visible" intro="quick" />
        </h2>
        <div
          role="group"
          aria-label="View"
          className="work-view-switch col-span-2 flex justify-end gap-1 md:col-span-3 md:col-start-7 md:justify-start"
        >
          {views.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={view === value}
              onClick={() => setView(value)}
              className="px-2 py-0.5 text-ink-muted transition-colors hover:text-accent aria-pressed:bg-ink aria-pressed:text-surface"
            >
              {label}
            </button>
          ))}
        </div>
        <FlapText
          text={`${Math.min(...years)}—${Math.max(...years)}`}
          className="hidden text-right text-ink-faint md:col-span-3 md:col-start-10 md:block"
          trigger="visible"
          intro="quick"
        />
      </div>

      <div className="work-view-index col-span-full grid grid-cols-subgrid">
        <WorkIndex items={items} morph={view === 'index'} />
      </div>

      <ul className="work-view-passes col-span-full grid-cols-subgrid gap-y-(--gutter)">
        {items.map((item, i) => (
          <li key={item.meta.slug} className="col-span-full md:col-span-6" style={{ '--i': i } as React.CSSProperties}>
            <BoardingPass item={item} index={i} variant="card" morph={view === 'passes'} />
          </li>
        ))}
      </ul>
    </>
  )
}
