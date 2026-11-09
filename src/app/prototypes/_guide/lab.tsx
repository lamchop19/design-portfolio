'use client'

import { useEffect, useState } from 'react'

import { LogoIntro } from '@/components/brand/logo/logo-intro'
import { GuideLanding } from '@/components/guide/landing'
import { GUIDE_LOOK, type GuideLook, type LayoutId, type TypeId } from '@/components/guide/look'
import type { SectionPreview } from '@/components/guide/previews'
import { setScene, useScene } from '@/components/scenes/use-scene'
import type { SectionId } from '@/lib/guide'
import { ALL_CHOICES, BACKDROP_SCENES, choiceId, type SceneChoice } from '@/lib/scene-choice'

import '../_panel/panel.css'
import './lab.css'

const LAYOUTS: { id: LayoutId; name: string; note: string }[] = [
  { id: 'index', name: 'Index', note: 'After jadefranson.com: the mark and an index menu top left, numbers on the right, the sentence bottom right with its first line indented a column, the scene boxes where her clock sits.' },
  { id: 'statement', name: 'Statement', note: 'After Craft and Freshman: the sentence is the headline, the menu runs along the foot in four columns on a rule, and the highlight is a bar on it.' },
  { id: 'axis', name: 'Axis', note: 'After Oevra: the page’s centre line is the axis. The mark sits against it on the left; the sentence and the menu hang off the right.' },
  { id: 'table', name: 'Table', note: 'After Waka Waka: the menu as an index table on the page’s own columns, each row saying what its section holds.' },
  { id: 'split', name: 'Split', note: 'After Analogue: the sentence as one line over a rule, the menu big in the left half with superscript numbers, the mark in the right half.' },
  { id: 'masthead', name: 'Masthead', note: 'The wireframe, centred, with its menu in ruled cells along the foot.' },
  { id: 'channel', name: 'Channel', note: 'Centred, with the menu as the Sky Guide’s list: blue bars and a yellow highlight, now square.' },
]

const TYPES: { id: TypeId; name: string; note: string }[] = [
  { id: 'wireframe', name: 'Wireframe', note: 'Geist, light and bold, standing in for the Figma’s Helvetica Neue.' },
  { id: 'serif-mono', name: 'Serif + mono', note: 'After jadefranson.com: Newsreader for the sentence, small Paper Mono capitals for the menu.' },
  { id: 'mono', name: 'Paper Mono', note: 'The site’s one face until now, regular and semibold.' },
  { id: 'broadcast', name: 'Broadcast', note: 'Archivo, with the menu in condensed extra-bold capitals like the Sky Guide’s.' },
  { id: 'grotesk-mono', name: 'Grotesk + mono', note: 'Geist for the sentence, Paper Mono capitals for the menu.' },
  { id: 'dot', name: 'Dot matrix', note: 'Geist for the sentence, the menu in Doto’s LED dots, like the name under the mark.' },
  { id: 'bricolage', name: 'Bricolage', note: 'Bricolage Grotesque: warmer, and a little odd.' },
]

/** How the intro's title card sets "feature presentation" under the mark. */
const CARDS = [
  { id: 'width', name: 'Card fits' },
  { id: 'dots', name: 'Card wide' },
] as const

const INKS: { id: GuideLook['ink']; name: string }[] = [
  { id: 'deep', name: 'Deep blue' },
  { id: 'blue', name: 'Brand blue' },
  { id: 'black', name: 'Black' },
]

const HIGHLIGHTS: { id: GuideLook['highlight']; name: string }[] = [
  { id: 'blue', name: 'Blue block' },
  { id: 'yellow', name: 'Yellow block' },
]

/** How strongly the scene shows: the custom properties in components/scenes/scene-backdrop.css, from their defaults. */
const DIALS = [
  { id: '--bd-blur', name: 'Blur', min: 0, max: 64, step: 1, initial: 28, unit: 'px' },
  { id: '--bd-opacity', name: 'Strength', min: 0, max: 1, step: 0.01, initial: 0.4, unit: '' },
  { id: '--bd-veil', name: 'Veil', min: 0, max: 1, step: 0.01, initial: 0.35, unit: '' },
  { id: '--bd-saturate', name: 'Saturation', min: 0.4, max: 1.8, step: 0.05, initial: 1.15, unit: '' },
]

const label = (choice: (typeof ALL_CHOICES)[number]) => `${choice.meta.name} · ${choice.variant}`

/**
 * The homepage from Marc's "new layout" wireframe, with a panel to try it
 * other ways before the picks go on the site: seven layouts on the grid,
 * seven faces, the ink and the highlight, how strongly the scene shows
 * behind it and which four scenes sit in the boxes. [ and ] step through the
 * layouts with the panel folded away. Replay runs the intro over it, with its
 * title card fitted or wide. Copy picks puts the choices on the clipboard, to
 * paste back.
 */
export function GuideLab({
  logo,
  intros,
  previews,
  fontClasses,
}: {
  logo: string
  /** The intro's mark with its title card fitted to the mark's width, and in the name's own dots. */
  intros: Record<(typeof CARDS)[number]['id'], string>
  previews: Record<SectionId, SectionPreview>
  fontClasses: string
}) {
  const [look, setLook] = useState<GuideLook>(GUIDE_LOOK)
  const [dials, setDials] = useState<Record<string, number>>(() => Object.fromEntries(DIALS.map((d) => [d.id, d.initial])))
  const [boxes, setBoxes] = useState<SceneChoice[]>(BACKDROP_SCENES)
  const [card, setCard] = useState<(typeof CARDS)[number]['id']>('width')
  const [take, setTake] = useState(0)
  const [folded, setFolded] = useState(false)
  const [copied, setCopied] = useState(false)
  const scene = useScene()
  const pick = <K extends keyof GuideLook>(key: K, value: GuideLook[K]) => setLook((l) => ({ ...l, [key]: value }))

  // The backdrop lives in the root layout, so the lab steers it from <html>.
  useEffect(() => {
    const root = document.documentElement
    for (const d of DIALS) root.style.setProperty(d.id, `${dials[d.id]}${d.unit}`)
  }, [dials])

  useEffect(() => {
    const root = document.documentElement
    return () => DIALS.forEach((d) => root.style.removeProperty(d.id))
  }, [])

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(timer)
  }, [copied])

  // [ and ] step through the layouts.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const step = { '[': -1, ']': 1 }[event.key]
      if (!step || event.metaKey || event.ctrlKey || event.altKey) return
      if ((event.target as HTMLElement).closest('input, textarea')) return
      setLook((l) => {
        const i = LAYOUTS.findIndex((option) => option.id === l.layout)
        return { ...l, layout: LAYOUTS[(i + step + LAYOUTS.length) % LAYOUTS.length].id }
      })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /** Puts the scene on show into one of the boxes. */
  const put = (slot: number) => {
    const shown = ALL_CHOICES.find((c) => c.id === scene)
    if (shown) setBoxes((all) => all.map((box, i) => (i === slot ? { scene: shown.scene, variant: shown.variant } : box)))
  }

  const replay = () => {
    document.documentElement.dataset.intro = 'play'
    setTake((t) => t + 1)
  }

  const copy = async () => {
    const picks = [
      `layout: ${look.layout}`,
      `type: ${look.type}`,
      `ink: ${look.ink}`,
      `highlight: ${look.highlight}`,
      `title card: ${card}`,
      ...DIALS.map((d) => `${d.name.toLowerCase()}: ${dials[d.id]}${d.unit}`),
      `boxes: ${boxes.map(choiceId).join(', ')}`,
    ].join('\n')
    try {
      await navigator.clipboard.writeText(picks)
      setCopied(true)
    } catch {}
  }

  const notes = [LAYOUTS.find((l) => l.id === look.layout)!.note, TYPES.find((t) => t.id === look.type)!.note]

  return (
    <div className={`gl ${fontClasses}`}>
      {take > 0 && <LogoIntro key={take} svg={intros[card]} target=".guide-logo" />}
      <GuideLanding logo={logo} look={look} previews={previews} scenes={boxes} />

      <aside className="hl-panel hl-corner gl-panel" aria-label="Guide lab" data-folded={folded || undefined}>
        <div className="hl-options" role="radiogroup" aria-label="Layout">
          {LAYOUTS.map((option) => (
            <button key={option.id} type="button" role="radio" aria-checked={option.id === look.layout} className="hl-chip" onClick={() => pick('layout', option.id)}>
              {option.name}
            </button>
          ))}
          <button type="button" className="hl-chip hl-fold" onClick={() => setFolded((f) => !f)} aria-expanded={!folded}>
            {folded ? 'Guide lab' : 'Hide'}
          </button>
        </div>

        <div className="hl-options" role="radiogroup" aria-label="Type">
          {TYPES.map((option) => (
            <button key={option.id} type="button" role="radio" aria-checked={option.id === look.type} className="hl-chip" onClick={() => pick('type', option.id)}>
              {option.name}
            </button>
          ))}
        </div>

        <div className="hl-options">
          <span role="radiogroup" aria-label="Ink" className="gl-set">
            {INKS.map((option) => (
              <button key={option.id} type="button" role="radio" aria-checked={option.id === look.ink} className="hl-chip" onClick={() => pick('ink', option.id)}>
                {option.name}
              </button>
            ))}
          </span>
          <span role="radiogroup" aria-label="Highlight" className="gl-set">
            {HIGHLIGHTS.map((option) => (
              <button key={option.id} type="button" role="radio" aria-checked={option.id === look.highlight} className="hl-chip" onClick={() => pick('highlight', option.id)}>
                {option.name}
              </button>
            ))}
          </span>
        </div>

        <div className="hl-options" role="radiogroup" aria-label="Title card">
          {CARDS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={option.id === card}
              className="hl-chip"
              onClick={() => {
                setCard(option.id)
                replay()
              }}
            >
              {option.name}
            </button>
          ))}
          <button type="button" className="hl-chip hl-replay" onClick={replay}>
            Replay intro
          </button>
        </div>

        {DIALS.map((dial) => (
          <label key={dial.id} className="hl-options gl-dial">
            <span className="t-label tabular-nums">
              {dial.name} {dials[dial.id]}
              {dial.unit}
            </span>
            <input
              type="range"
              min={dial.min}
              max={dial.max}
              step={dial.step}
              value={dials[dial.id]}
              onChange={(event) => setDials((all) => ({ ...all, [dial.id]: Number(event.target.value) }))}
            />
          </label>
        ))}

        <div className="hl-options" role="radiogroup" aria-label="Scene">
          {ALL_CHOICES.map((choice) => (
            <button key={choice.id} type="button" role="radio" aria-checked={choice.id === scene} className="hl-chip" onClick={() => setScene(choice.id)}>
              {label(choice)}
            </button>
          ))}
        </div>

        <div className="hl-options" role="group" aria-label="Boxes">
          <span className="t-label gl-boxes-label">Put it in box</span>
          {boxes.map((box, i) => (
            <button key={i} type="button" className="hl-chip" onClick={() => put(i)} title={`Put the scene on show in box ${i + 1}`}>
              {i + 1} · {label(ALL_CHOICES.find((c) => c.id === choiceId(box))!)}
            </button>
          ))}
        </div>

        <div className="hl-options">
          <button type="button" className="hl-chip" onClick={copy}>
            {copied ? 'Copied' : 'Copy picks'}
          </button>
          <button type="button" className="hl-chip" onClick={() => setDials(Object.fromEntries(DIALS.map((d) => [d.id, d.initial])))}>
            Reset backdrop
          </button>
        </div>

        <p className="hl-note">
          {notes.join(' ')} [ and ] step through the layouts; G draws the grid.
        </p>
      </aside>
    </div>
  )
}
