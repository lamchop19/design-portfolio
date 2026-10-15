'use client'

import { useState } from 'react'

import type { WorkItem } from '@/lib/work-items'

import { DeparturesBoard, type Preroll, type Reveal } from '../departures-board'

import '../../_heroload/hero-load.css'

const PREROLLS: { id: Preroll; label: string; note: string }[] = [
  { id: 'led', label: 'LED board', note: 'The name lights up across the whole screen, then shrinks and flies onto the board tile.' },
  { id: 'none', label: 'No intro', note: 'The page is there from the first frame.' },
]

const REVEALS: { id: Reveal; label: string; note: string }[] = [
  { id: 'drop', label: 'Baggage drop', note: 'Tiles land one by one in reading order, settling with a small bounce.' },
  { id: 'xray', label: 'X-ray scan', note: 'A scanner sweeps down; the page is an x-ray until the bar has passed.' },
  { id: 'none', label: 'No reveal', note: 'The tiles are simply there.' },
]

/**
 * The departures board with its load intro switchable: a full-screen intro
 * and a tile reveal, in any combination. Picking either, or pressing replay,
 * remounts the page so the whole thing plays again from the top. Click or
 * press a key during the intro to skip it.
 */
export function IntroLab({ items }: { items: WorkItem[] }) {
  const [preroll, setPreroll] = useState<Preroll>('led')
  const [reveal, setReveal] = useState<Reveal>('drop')
  const [run, setRun] = useState(0)

  const replay = (next: { preroll?: Preroll; reveal?: Reveal } = {}) => {
    window.scrollTo(0, 0)
    if (next.preroll) setPreroll(next.preroll)
    if (next.reveal) setReveal(next.reveal)
    setRun((r) => r + 1)
  }

  const notes = [PREROLLS.find((p) => p.id === preroll)!, REVEALS.find((r) => r.id === reveal)!]
    .filter((option) => option.id !== 'none')
    .map((option) => option.note)

  return (
    <>
      <DeparturesBoard key={`${preroll}-${reveal}-${run}`} items={items} preroll={preroll} reveal={reveal} />
      <aside className="hl-panel" aria-label="Load intro">
        <div className="hl-options" role="radiogroup" aria-label="Intro">
          {PREROLLS.map((option) => (
            <button key={option.id} type="button" role="radio" aria-checked={preroll === option.id} className="hl-chip" onClick={() => replay({ preroll: option.id })}>
              {option.label}
            </button>
          ))}
          <button type="button" className="hl-chip hl-replay" onClick={() => replay()}>
            Replay ↺
          </button>
        </div>
        <div className="hl-options" role="radiogroup" aria-label="Tile reveal">
          {REVEALS.map((option) => (
            <button key={option.id} type="button" role="radio" aria-checked={reveal === option.id} className="hl-chip" onClick={() => replay({ reveal: option.id })}>
              {option.label}
            </button>
          ))}
        </div>
        <p className="hl-note">{notes.length ? notes.join(' Then: ') : 'Nothing plays; the page simply appears.'} Click or press any key to skip the intro.</p>
      </aside>
    </>
  )
}
