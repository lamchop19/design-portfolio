'use client'

import { useEffect, useState } from 'react'

import { RuledIndex } from '@/components/home/ruled-index'
import type { WorkItem } from '@/lib/work-items'

import { WaterCaustics } from './water-caustics'

import '../_panel/panel.css'
import './ocean-lab.css'

type Water = 'lines' | 'caustics' | 'ripple' | 'none'

const WATERS: Array<{ id: Water; name: string; note: string }> = [
  { id: 'lines', name: 'A · Swell lines', note: 'Engraved swell lines, one 1-bit tile, thickening with depth. What the homepage uses.' },
  { id: 'caustics', name: 'B · Caustics', note: 'A live dithered net of light, as on a sea bed, drawn on a canvas at dot resolution; denser further down the page. Costs a little CPU.' },
  { id: 'ripple', name: 'C · Ripple', note: 'The swell lines bent by a slowly drifting SVG turbulence, so they wobble like water. Heavy on long pages.' },
  { id: 'none', name: 'No water', note: 'Specimens only, on bare paper.' },
]

const FONTS = [
  { id: 'paper', name: 'Paper Mono', family: 'var(--font-paper-mono)' },
  { id: 'doto', name: 'Doto', family: 'var(--font-doto)' },
  { id: 'bricolage', name: 'Bricolage', family: 'var(--font-display-alt)' },
  { id: 'instrument', name: 'Instrument Serif', family: 'var(--font-instrument)' },
] as const

type FontId = (typeof FONTS)[number]['id']

const DOTS = [1, 2, 3] as const

const INKS = [
  { id: '--ocean-water', name: 'Water', initial: 0.1 },
] as const

/**
 * The homepage with a panel for tuning its ocean: which water treatment,
 * the dot size, how strongly the water prints, and a trial of faces for the
 * wordmark.
 */
export function OceanLab({ items, fontClasses }: { items: WorkItem[]; fontClasses: string }) {
  const [water, setWater] = useState<Water>('lines')
  const [dot, setDot] = useState<number | null>(null)
  const [inks, setInks] = useState<Record<string, number>>(() => Object.fromEntries(INKS.map((i) => [i.id, i.initial])))
  const [font, setFont] = useState<FontId>('paper')
  const [run, setRun] = useState(0)
  const [folded, setFolded] = useState(false)

  // The wallpaper lives in the root layout, so the lab steers it from <html>.
  useEffect(() => {
    const root = document.documentElement
    root.dataset.water = water
    if (dot) root.style.setProperty('--dot', String(dot))
    else root.style.removeProperty('--dot')
    for (const [name, value] of Object.entries(inks)) root.style.setProperty(name, String(value))
  }, [water, dot, inks])

  useEffect(() => {
    const root = document.documentElement
    return () => {
      delete root.dataset.water
      for (const name of ['--dot', ...INKS.map((i) => i.id)]) root.style.removeProperty(name)
    }
  }, [])

  const family = FONTS.find((f) => f.id === font)!.family

  return (
    <div className={fontClasses} style={{ '--font-wordmark': family } as React.CSSProperties}>
      <RuledIndex key={run} items={items} />

      {water === 'caustics' && <WaterCaustics />}
      {water === 'ripple' && (
        <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
          <filter id="ocean-ripple">
            <feTurbulence type="fractalNoise" baseFrequency="0.004 0.012" numOctaves="2" seed="7">
              <animate attributeName="baseFrequency" dur="40s" values="0.004 0.012;0.006 0.016;0.004 0.012" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" scale="14" />
          </filter>
        </svg>
      )}

      <aside className="hl-panel hl-corner" aria-label="Ocean options" data-folded={folded || undefined}>
        <div className="hl-options" role="radiogroup" aria-label="Water">
          {WATERS.map((option) => (
            <button key={option.id} type="button" role="radio" aria-checked={option.id === water} className="hl-chip" onClick={() => setWater(option.id)}>
              {option.name}
            </button>
          ))}
          <button type="button" className="hl-chip hl-fold" onClick={() => setFolded((f) => !f)} aria-expanded={!folded}>
            {folded ? 'Ocean' : 'Hide'}
          </button>
        </div>
        <div className="hl-options" role="radiogroup" aria-label="Wordmark face">
          {FONTS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={option.id === font}
              className="hl-chip"
              onClick={() => {
                setFont(option.id)
                setRun((r) => r + 1)
              }}
            >
              {option.name}
            </button>
          ))}
          <button type="button" className="hl-chip hl-replay" onClick={() => setRun((r) => r + 1)}>
            Replay load ↺
          </button>
        </div>
        <div className="hl-options" role="radiogroup" aria-label="Dot size">
          <button type="button" role="radio" aria-checked={dot === null} className="hl-chip" onClick={() => setDot(null)}>
            Auto dot
          </button>
          {DOTS.map((size) => (
            <button key={size} type="button" role="radio" aria-checked={size === dot} className="hl-chip" onClick={() => setDot(size)}>
              {size}px
            </button>
          ))}
        </div>
        {INKS.map((ink) => (
          <label key={ink.id} className="ol-range">
            <span>{ink.name}</span>
            <input
              type="range"
              min={0}
              max={0.6}
              step={0.01}
              value={inks[ink.id]}
              onChange={(event) => setInks((current) => ({ ...current, [ink.id]: Number(event.target.value) }))}
            />
            <span className="tabular-nums">{Math.round(inks[ink.id] * 100)}%</span>
          </label>
        ))}
        <p className="hl-note">{WATERS.find((w) => w.id === water)!.note}</p>
      </aside>
    </div>
  )
}
