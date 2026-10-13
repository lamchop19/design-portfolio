'use client'

import { useState } from 'react'

import { LandingFlight, type HeroIntro } from '@/components/landing/landing-flight'
import type { WorkItem } from '@/lib/work-items'

import './hero-load.css'

const INTROS: { id: HeroIntro; label: string; note: string }[] = [
  {
    id: 'cascade',
    label: 'Cascade',
    note: 'Top down. The strip drops in, the name resolves, the strap rises, then the hall builds itself: wall lines fall, the floor lays and bags roll in on the belt.',
  },
  {
    id: 'lights',
    label: 'Lights up',
    note: 'The name resolves alone in the dark. Then the hall’s lights strike like fluorescent tubes, bags drop onto the belt one by one, and the strap and strip follow.',
  },
  {
    id: 'belt',
    label: 'Luggage first',
    note: 'The belt leads: bags roll in, then the name resolves above them, then the strap and the strip.',
  },
  {
    id: 'shade',
    label: 'Shade up',
    note: 'A window shade — the same one as the theme control — lifts off the first screen as the name lights and the bags roll in.',
  },
  { id: 'none', label: 'All at once', note: 'Today’s homepage: everything arrives together and only the name animates.' },
]

/**
 * The live homepage with its load intro switchable. Picking an intro, or
 * pressing replay, remounts the page so the intro plays again from the top.
 */
export function HeroLoadLab({ items }: { items: WorkItem[] }) {
  const [intro, setIntro] = useState<HeroIntro>('lights')
  const [run, setRun] = useState(0)
  const current = INTROS.find((option) => option.id === intro)!

  const play = (id: HeroIntro) => {
    window.scrollTo(0, 0)
    setIntro(id)
    setRun((r) => r + 1)
  }

  return (
    <>
      <LandingFlight key={`${intro}-${run}`} items={items} intro={intro} />
      <aside className="hl-panel" aria-label="Hero intro">
        <div className="hl-options" role="radiogroup">
          {INTROS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={intro === option.id}
              className="hl-chip"
              onClick={() => play(option.id)}
            >
              {option.label}
            </button>
          ))}
          <button type="button" className="hl-chip hl-replay" onClick={() => play(intro)}>
            Replay ↺
          </button>
        </div>
        <p className="hl-note">{current.note}</p>
      </aside>
    </>
  )
}
