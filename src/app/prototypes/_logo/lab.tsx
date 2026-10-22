'use client'

import { useState } from 'react'

import { HOVERS, LOADS, type HoverId, type LoadId } from '@/components/brand/logo/effects'
import { LogoMark } from '@/components/brand/logo/logo-mark'
import type { Colorway } from '@/components/brand/logo/source'

import '../_panel/panel.css'
import './logo.css'

const COLORWAYS: { id: Colorway; name: string }[] = [
  { id: 'blue', name: 'Blue' },
  { id: 'green', name: 'Green' },
  { id: 'pink', name: 'Pink' },
]

const GROUNDS = [
  { id: 'dark', name: 'Dark' },
  { id: 'paper', name: 'Paper' },
] as const

/**
 * The maL mark from Marc's "logos final" frame: three colourways, five loads,
 * five hovers. The mark itself is the site's (components/brand/logo), which
 * the homepage intro and the frame's pill use with Marc's picks below.
 */
export function LogoLab({ svgs }: { svgs: Record<Colorway, string> }) {
  const [colorway, setColorway] = useState<Colorway>('blue')
  const [ground, setGround] = useState<(typeof GROUNDS)[number]['id']>('dark')
  // Marc's picks: the halftone load, with Sweep, Boil and Shift on hover.
  const [load, setLoad] = useState<LoadId>('halftone')
  const [hovers, setHovers] = useState<HoverId[]>(['sweep', 'boil', 'shift'])
  const [take, setTake] = useState(0)
  const [folded, setFolded] = useState(false)

  const loadNote = LOADS.find((l) => l.id === load)!.note
  const hoverNote = HOVERS.filter((h) => hovers.includes(h.id))
    .map((h) => `${h.name}: ${h.note}`)
    .join('. ')

  const toggle = (id: HoverId) => {
    setHovers((all) => (all.includes(id) ? all.filter((h) => h !== id) : HOVERS.map((h) => h.id).filter((h) => h === id || all.includes(h))))
  }

  return (
    <div className="lg" data-ground={ground}>
      <div className="lg-stage">
        <LogoMark key={`${colorway}-${load}-${take}`} svg={svgs[colorway]} load={load} hovers={hovers} label="maL, Marc Andre Lam" className="lg-mark" />
      </div>

      <aside className="hl-panel hl-corner lg-panel" aria-label="Logo motion" data-folded={folded || undefined}>
        <div className="hl-options" role="radiogroup" aria-label="Load">
          {LOADS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={option.id === load}
              className="hl-chip"
              onClick={() => {
                setLoad(option.id)
                setTake((t) => t + 1)
              }}
            >
              {option.name}
            </button>
          ))}
          <button type="button" className="hl-chip hl-replay" onClick={() => setTake((t) => t + 1)}>
            Replay
          </button>
          <button type="button" className="hl-chip hl-fold" onClick={() => setFolded((f) => !f)} aria-expanded={!folded}>
            {folded ? 'Controls' : 'Hide'}
          </button>
        </div>
        <div className="hl-options" role="group" aria-label="Hover">
          {HOVERS.map((option) => (
            <button key={option.id} type="button" aria-pressed={hovers.includes(option.id)} className="hl-chip" onClick={() => toggle(option.id)}>
              {option.name}
            </button>
          ))}
        </div>
        <div className="hl-options">
          <span role="radiogroup" aria-label="Colourway" className="lg-set">
            {COLORWAYS.map((option) => (
              <button key={option.id} type="button" role="radio" aria-checked={option.id === colorway} className="hl-chip" onClick={() => setColorway(option.id)}>
                {option.name}
              </button>
            ))}
          </span>
          <span role="radiogroup" aria-label="Ground" className="lg-set">
            {GROUNDS.map((option) => (
              <button key={option.id} type="button" role="radio" aria-checked={option.id === ground} className="hl-chip" onClick={() => setGround(option.id)}>
                {option.name}
              </button>
            ))}
          </span>
        </div>
        <p className="hl-note">
          {loadNote} {hoverNote ? `Hover: ${hoverNote}.` : 'No hover effects on.'}
        </p>
      </aside>
    </div>
  )
}
