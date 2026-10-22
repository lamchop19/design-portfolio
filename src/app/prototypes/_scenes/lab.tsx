'use client'

import { useEffect, useState } from 'react'

import { LogoMark } from '@/components/brand/logo/logo-mark'
import { asset } from '@/lib/paths'
import { SCENES, sceneFile, slotAt, variantAt } from '@/lib/scenes'
import { site } from '@/../content/site'

import { type Hotspot, ScenePlayer } from './player'

import '../_panel/panel.css'
import './scenes.css'

type Placement = 'hero' | 'window' | 'sleeve' | 'gallery'

const PLACEMENTS: { id: Placement; name: string; note: string }[] = [
  { id: 'hero', name: 'Hero', note: 'Full bleed behind the top of the homepage, under the frame, with the name set over the sky in the scene’s ink.' },
  { id: 'window', name: 'Window', note: 'A window beside the menu on paper, after the DVD lab’s Index and Split layouts.' },
  { id: 'sleeve', name: 'Sleeve', note: 'A 7-inch single on the paper, after the Nagai covers: the scene cropped square under a title and label. Point at it and the record slides out.' },
  { id: 'gallery', name: 'All scenes', note: 'Every scene and variant on one sheet; pick one to open it as the hero.' },
]

/** The hour now in New York, the clock in the site's frame. */
const nycHour = () => Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'America/New_York', hour: '2-digit', hourCycle: 'h23' }).format(new Date()))

/** What the record store's blank signs say, by hotspot id. */
const SIGNS: Record<string, string> = { work: 'Work', experience: 'Experience', about: 'About', contact: 'Contact', scraps: 'Scraps' }

/**
 * The scenes (src/lib/scenes.ts, painted by scripts/generate-scenes.tsx) as
 * the homepage could use them: full-bleed hero, a window beside the menu, or
 * a record sleeve, plus a sheet of all of them. Motion plays each scene's
 * twinkles and moving layers; reduced motion keeps the stills. Clock picks
 * each scene's variant by the hour in New York, with a slider to try other
 * hours. ← and → step through the scenes.
 */
export function ScenesLab({ mark, work }: { mark: string; work: { title: string; year: number; slug: string }[] }) {
  const [sceneId, setSceneId] = useState(SCENES[0].id)
  const [chosen, setVariant] = useState(SCENES[0].variants[0])
  const [hour, setHour] = useState<number | null>(null)
  const [placement, setPlacement] = useState<Placement>('hero')
  const [motion, setMotion] = useState(true)
  const [folded, setFolded] = useState(false)
  const scene = SCENES.find((s) => s.id === sceneId) ?? SCENES[0]
  // With the clock on, the hour picks the variant; picking one by hand turns it off.
  const variant = hour === null ? chosen : variantAt(scene, hour)
  const ink = scene.ink[variant] ?? 'light'
  const pick = (v: string) => {
    setHour(null)
    setVariant(v)
  }
  const note = PLACEMENTS.find((p) => p.id === placement)!.note

  const choose = (id: string, next?: string) => {
    const s = SCENES.find((x) => x.id === id) ?? SCENES[0]
    setSceneId(s.id)
    setVariant(next ?? s.variants[0])
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key]
      if (!step || (event.target as HTMLElement).closest('input, textarea, .hl-panel')) return
      const i = SCENES.findIndex((s) => s.id === sceneId)
      const next = SCENES[(i + step + SCENES.length) % SCENES.length]
      setSceneId(next.id)
      setVariant(next.variants[0])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sceneId])

  const signs = (spot: Hotspot) => (
    <a className="sc-sign" href={`#${spot.id}`} onClick={(e) => e.preventDefault()}>
      {SIGNS[spot.id] ?? spot.id}
    </a>
  )

  return (
    <div className="sc" data-placement={placement}>
      {placement === 'hero' && (
        <section className="sc-hero" aria-label={`${scene.name}, as the homepage’s hero`}>
          <ScenePlayer key={`${scene.id}-${variant}`} scene={scene} variant={variant} motion={motion} className="sc-fill" renderHotspot={signs} />
          <div className="sc-hero-type" data-ink={ink}>
            <h1>{site.name}</h1>
            <p>{site.headline}</p>
          </div>
        </section>
      )}

      {placement === 'window' && (
        <section className="sc-window-page">
          <div className="sc-window-text">
            <h1>{site.name}</h1>
            <p className="sc-bio">{site.bio}</p>
            <ul className="sc-menu">
              {work.map((item) => (
                <li key={item.slug}>
                  <span>{item.title}</span>
                  <span className="t-label">{item.year}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="sc-window">
            <ScenePlayer key={`${scene.id}-${variant}`} scene={scene} variant={variant} motion={motion} className="sc-fill" renderHotspot={signs} />
            <span className="sc-window-tag t-label">{scene.name}</span>
          </div>
        </section>
      )}

      {placement === 'sleeve' && (
        <section className="sc-sleeve-page">
          <div className="sc-sleeve-wrap" tabIndex={0} aria-label={`${scene.name} as a record sleeve. Point at it or focus it to slide the record out.`}>
            <div className="sc-record" aria-hidden="true">
              <span className="sc-record-label">
                <LogoMark svg={mark} className="sc-record-mark" />
              </span>
            </div>
            <div className="sc-sleeve">
              <ScenePlayer key={`${scene.id}-${variant}`} scene={scene} variant={variant} motion={motion} className="sc-fill" />
              <div className="sc-sleeve-title" data-ink={ink}>
                <h2>{site.name}</h2>
                <p>Works 2024–2025</p>
              </div>
              <div className="sc-sleeve-badge">
                <LogoMark svg={mark} className="sc-badge-mark" />
                <span>maL-001</span>
                <span>45RPM · STEREO</span>
              </div>
              <div className="sc-sleeve-sides">
                <span>A · {work.slice(0, 2).map((w) => w.title).join(' · ')}</span>
                <span>B · {work.slice(2).map((w) => w.title).join(' · ')}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {placement === 'gallery' && (
        <section className="sc-gallery">
          <p className="t-label text-ink-faint">Scenes · {SCENES.length} scenes, {SCENES.reduce((n, s) => n + s.variants.length, 0)} variants</p>
          <ul>
            {SCENES.flatMap((s) =>
              s.variants.map((v) => (
                <li key={`${s.id}-${v}`}>
                  <button
                    type="button"
                    className="sc-card"
                    onClick={() => {
                      choose(s.id, v)
                      setHour(null)
                      setPlacement('hero')
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- generated stills in public/ */}
                    <img src={asset(sceneFile(s.id, v))} alt="" loading="lazy" decoding="async" />
                    <span className="sc-card-name">
                      {s.name} <span className="t-label">{v}</span>
                    </span>
                    <span className="sc-card-note">{s.note}</span>
                  </button>
                </li>
              )),
            )}
          </ul>
        </section>
      )}

      <aside className="hl-panel hl-corner sc-panel" aria-label="Scenes lab" data-folded={folded || undefined}>
        <div className="hl-options" role="radiogroup" aria-label="Scene">
          {SCENES.map((s) => (
            <button key={s.id} type="button" role="radio" aria-checked={s.id === scene.id} className="hl-chip" onClick={() => choose(s.id)}>
              {s.name}
            </button>
          ))}
          <button type="button" className="hl-chip hl-fold" onClick={() => setFolded((f) => !f)} aria-expanded={!folded}>
            {folded ? 'Scenes' : 'Hide'}
          </button>
        </div>
        <div className="hl-options">
          <span role="radiogroup" aria-label="Variant" className="sc-set">
            {scene.variants.map((v) => (
              <button key={v} type="button" role="radio" aria-checked={v === variant} className="hl-chip" onClick={() => pick(v)}>
                {v}
              </button>
            ))}
          </span>
          <span className="sc-set">
            <button type="button" aria-pressed={hour !== null} className="hl-chip" onClick={() => setHour((h) => (h === null ? nycHour() : null))}>
              Clock
            </button>
            <button type="button" aria-pressed={motion} className="hl-chip" onClick={() => setMotion((m) => !m)}>
              Motion
            </button>
          </span>
        </div>
        {hour !== null && (
          <label className="hl-options sc-clock">
            <span className="t-label tabular-nums">
              NYC {String(hour).padStart(2, '0')}:00 · {slotAt(hour)}
            </span>
            <input type="range" min={0} max={23} step={1} value={hour} onChange={(e) => setHour(Number(e.target.value))} aria-label="Hour in New York" />
            <button type="button" className="hl-chip" onClick={() => setHour(nycHour())}>
              Now
            </button>
          </label>
        )}
        <div className="hl-options" role="radiogroup" aria-label="Placement">
          {PLACEMENTS.map((p) => (
            <button key={p.id} type="button" role="radio" aria-checked={p.id === placement} className="hl-chip" onClick={() => setPlacement(p.id)}>
              {p.name}
            </button>
          ))}
        </div>
        <p className="hl-note">
          <strong>{scene.name}</strong>, after {scene.after}. {scene.note} {note}
        </p>
      </aside>
    </div>
  )
}
