'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { WorkItem } from '@/lib/work-items'

import { Backdrop, BACKDROPS, type BackdropId } from './backdrops'
import { LAYOUTS, SectionScreen, WORDMARKS, type LayoutId, type WordmarkId } from './layouts'
import { CUT_MS, SECTIONS, type SectionId } from './menu'

import '../_panel/panel.css'
import './dvd.css'

/**
 * The homepage as a DVD main menu, from Marc's Figma moodboard, plus layouts
 * after chiquach.com and franceszhao.ca and Split, which merges them. Seven
 * layouts over three looping backdrops, and four wordmarks for Split. Picking
 * an item dissolves into a stub of that section with a way back (Split opens
 * its own pages in its pane). The panel folds away to judge a layout clean.
 */
export function DvdLab({ items, cases, fontClass }: { items: WorkItem[]; cases: Record<string, React.ReactNode>; fontClass: string }) {
  const [layout, setLayout] = useState<LayoutId>('split')
  const [wordmark, setWordmark] = useState<WordmarkId>('radio')
  const [backdrop, setBackdrop] = useState<BackdropId>('fish')
  const [folded, setFolded] = useState(false)
  const [open, setOpen] = useState<SectionId | null>(null)
  const [cutting, setCutting] = useState(false)
  const [last, setLast] = useState<SectionId>('work')
  const timer = useRef(0)
  const current = LAYOUTS.find((l) => l.id === layout)!
  const Layout = current.Component
  // Paper layouts show the scene themselves; a section opened from one still plays full-screen.
  const paper = current.paper && !open

  // Dissolve out, swap screens, dissolve in. Instant under reduced motion.
  const cut = useCallback((next: SectionId | null) => {
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    clearTimeout(timer.current)
    setCutting(true)
    timer.current = window.setTimeout(
      () => {
        if (next) setLast(next)
        setOpen(next)
        setCutting(false)
      },
      still ? 0 : CUT_MS,
    )
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Backspace') cut(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, cut])

  useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <div className={`dvd ${fontClass}`} data-backdrop={backdrop} data-surface={paper ? 'paper' : undefined}>
      {!paper && <Backdrop kind={backdrop} />}
      <div className="dvd-screen" data-cutting={cutting || undefined} key={open ?? layout}>
        {open ? <SectionScreen id={open} items={items} onBack={() => cut(null)} /> : <Layout items={items} cases={cases} initial={SECTIONS.findIndex((s) => s.id === last)} backdrop={backdrop} wordmark={wordmark} onSelect={cut} />}
      </div>

      <aside className="hl-panel hl-corner dvd-lab-panel" aria-label="DVD menu layouts" data-folded={folded || undefined}>
        <div className="hl-options" role="radiogroup" aria-label="Layout">
          {LAYOUTS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={option.id === layout}
              className="hl-chip"
              onClick={() => {
                setLayout(option.id)
                setOpen(null)
              }}
            >
              {option.name}
            </button>
          ))}
          <button type="button" className="hl-chip hl-fold" onClick={() => setFolded((f) => !f)} aria-expanded={!folded}>
            {folded ? 'Layouts' : 'Hide'}
          </button>
        </div>
        <div className="hl-options" role="radiogroup" aria-label="Backdrop">
          {BACKDROPS.map((option) => (
            <button key={option.id} type="button" role="radio" aria-checked={option.id === backdrop} className="hl-chip" onClick={() => setBackdrop(option.id)}>
              {option.name}
            </button>
          ))}
        </div>
        {layout === 'split' && (
          <div className="hl-options" role="radiogroup" aria-label="Wordmark">
            {WORDMARKS.map((option) => (
              <button key={option.id} type="button" role="radio" aria-checked={option.id === wordmark} className="hl-chip" onClick={() => setWordmark(option.id)}>
                {option.name}
              </button>
            ))}
          </div>
        )}
        <p className="hl-note">{current.note}</p>
      </aside>
    </div>
  )
}
