'use client'

import Link from 'next/link'
import { Fragment, useEffect, useLayoutEffect, useState } from 'react'

import { LogoIntro } from '@/components/brand/logo/logo-intro'
import { LogoMark } from '@/components/brand/logo/logo-mark'
import { ChannelWord } from '@/components/guide/channel-word'
import { guideFont } from '@/components/guide/fonts'
import { site } from '@/../content/site'

import { SCHOOL_LOOK, type SchoolLook } from './fish-gl'
import { FishSchool } from './fish-school'
import { IntroDash } from './intro-dash'
import { type Layout, LAYOUTS, SCHOOL_PRESETS, SchoolPanel } from './panel'

import '@/components/guide/guide.css'
import '../_panel/panel.css'
import './school.css'

/** The intro, a little quicker than the homepage's (3.9s hold, 0.95s flight). */
const INTRO = { hold: 2500, flight: 750 }

/** What a preset sets: the colours and the ground. The fish's motion and shape stay as they are. */
const PALETTE_KEYS = ['ground', 'fish', 'groundStyle', 'blend', 'light', 'particles', 'grain', 'clearing', 'clearingStrength'] as const

const STORE = 'school-look-v3'
const LAYOUT_STORE = 'school-layout'

/** Words between ** are set heavier, and hyphenated words ("life-long") don't break at the hyphen. */
const emphasis = (text: string) =>
  text.split('**').map((part, i) => {
    const words = part.split(/(\S+-\S+)/).map((word, j) => (j % 2 ? <span key={j} className="whitespace-nowrap">{word}</span> : word))
    return i % 2 ? <strong key={i}>{words}</strong> : <Fragment key={i}>{words}</Fragment>
  })

const MENU = [
  { label: 'work', href: '/work' },
  { label: 'about', href: '/about' },
  { label: 'contact', href: `mailto:${site.email}` },
] as const

const hexTriple = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

/**
 * Marc's centred sketch of the landing: the maL mark with its dotted name,
 * the sentence ending on a word that changes, and work / about / contact in a
 * row underneath, on a pale ground with a school of fish that follows the
 * pointer. A soft paper clearing sits behind the type so the fish fade out
 * as they swim under it.
 *
 * Opens on the homepage's Halftone intro (with the name, no title card, and
 * quicker), with the school darting across the big mark as a preview; then
 * the mark flies into the middle and the sentence and menu settle up under
 * it. The corner panel tunes the fish and the ground and replays the intro;
 * settings stay in this browser.
 */
export function SchoolLanding({ introSvg, logoSvg }: { introSvg: string; logoSvg: string }) {
  const [run, setRun] = useState(0)
  const [look, setLook] = useState<SchoolLook>(SCHOOL_LOOK)
  const [preset, setPreset] = useState<string | null>('Shallows')
  const [count, setCount] = useState(SCHOOL_LOOK.start)
  const [layout, setLayoutState] = useState<Layout>('centred')
  const setLayout = (next: Layout) => {
    setLayoutState(next)
    try {
      localStorage.setItem(LAYOUT_STORE, next)
    } catch {}
  }

  // Number keys 1–6 switch layouts, for flipping between them quickly.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as Element | null)?.closest('input, textarea, select')) return
      const i = Number(e.key) - 1
      if (Number.isInteger(i) && LAYOUTS[i]) setLayout(LAYOUTS[i][0])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Settings from last time.
  useEffect(() => {
    let saved: { look?: SchoolLook; preset?: string | null } | null = null
    try {
      saved = JSON.parse(localStorage.getItem(STORE) ?? 'null')
    } catch {}
    // Read after hydration on purpose: the server can't see this browser's settings,
    // and reading them during render would make the first client render differ from it.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (saved?.look) {
      setLook({ ...SCHOOL_LOOK, ...saved.look })
      setPreset(saved.preset ?? null)
    }
    try {
      const l = localStorage.getItem(LAYOUT_STORE)
      if (LAYOUTS.some(([id]) => id === l)) setLayoutState(l as Layout)
    } catch {}
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  const save = (next: SchoolLook, p: string | null) => {
    try {
      localStorage.setItem(STORE, JSON.stringify({ look: next, preset: p }))
    } catch {}
  }
  const update = (patch: Partial<SchoolLook>) => {
    const palette = PALETTE_KEYS.some((k) => k in patch)
    setLook((l) => {
      const next = { ...l, ...patch }
      save(next, palette ? null : preset)
      return next
    })
    if (palette) setPreset(null)
  }
  const choose = (name: string) => {
    const p = SCHOOL_PRESETS.find((x) => x.name === name)
    setLook((l) => {
      const base = Object.fromEntries(PALETTE_KEYS.map((k) => [k, SCHOOL_LOOK[k]]))
      const next = { ...l, ...base, ...(p?.look ?? {}) } as SchoolLook
      save(next, name)
      return next
    })
    setPreset(name)
  }
  const reset = () => {
    try {
      localStorage.removeItem(STORE)
    } catch {}
    setLook({ ...SCHOOL_LOOK })
    setPreset('Shallows')
  }

  // The intro only plays when <html data-intro="play">. The page's inline
  // script covers a fresh load (before paint, so the landing never flashes
  // first); this covers arriving by a link, and Replay. Unlike the homepage it
  // plays on every visit, for testing.
  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    document.documentElement.dataset.intro = 'play'
  }, [run])

  const vars = {
    background: look.groundStyle === 'blank' ? '#ffffff' : look.ground[0],
    '--s-clear': hexTriple(look.clearing),
    '--s-clear-k': look.clearingStrength,
  } as React.CSSProperties

  return (
    <div className={`school ${guideFont.variable}`} style={vars} data-layout={layout}>
      <FishSchool look={look} className="school-fish" onCount={setCount} />

      {/* The cluster holds the three parts together for Centred (and on phones);
          the other layouts dissolve it and place each part on the stack's grid. */}
      <div className="school-stack">
        <div className="school-cluster">
          <h1 className="school-mast school-part">
            <LogoMark svg={logoSvg} label={site.name} className="school-logo" />
          </h1>

          <p className="school-bio school-part mal-intro-settle">
            {emphasis(site.intro)} <ChannelWord words={site.interests} />.
          </p>

          <nav className="school-menu school-part mal-intro-settle" aria-label="Sections">
            {MENU.map((item, i) => {
              const inner = (
                <>
                  <span className="school-num" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>{item.label}</span>
                </>
              )
              return item.href.startsWith('mailto:') ? (
                <a key={item.label} href={item.href}>
                  {inner}
                </a>
              ) : (
                <Link key={item.label} href={item.href}>
                  {inner}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      <SchoolPanel look={look} preset={preset} count={count} layout={layout} onLayout={setLayout} onLook={update} onPreset={choose} onReplay={() => setRun((n) => n + 1)} onReset={reset} />

      <LogoIntro key={`intro-${run}`} svg={introSvg} target=".school-logo" hold={INTRO.hold} flight={INTRO.flight} />
      <IntroDash key={`dash-${run}`} look={look} />
    </div>
  )
}
