'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { RuledIndex } from '@/components/home/ruled-index'
import { indexLabel, type WorkItem } from '@/lib/work-items'

import { useCentred } from './centred'
import { Cut } from './cut'
import { IMAGERY, inkOf, INKS, LAYOUTS, PAPER, PITCHES, sourceOf, TREATMENTS, type ImageryId, type InkId, type LayoutId, type Pitch } from './options'
import { Print } from './print'
import type { Treatment } from './print-gl'

import '../_panel/panel.css'
import './screen-print.css'

/**
 * Screen print: the work printed the way the maL mark is printed. Covers rest
 * as one-ink prints on the page's paper (dots, specks, lamps or two plates)
 * and, pointed at, swell into full colour the way the logo's Halftone load
 * resolves its letters. The Cut layout takes the same screen to the page
 * change. The panel picks the layout, treatment, ink, pitch and imagery.
 */
export function ScreenPrintLab({ items }: { items: WorkItem[] }) {
  const [layout, setLayout] = useState<LayoutId>('sheet')
  const [treatment, setTreatment] = useState<Treatment>('halftone')
  const [inkChoice, setInkChoice] = useState<InkId>('blue')
  const [pitch, setPitch] = useState<Pitch>(7)
  const [imagery, setImagery] = useState<ImageryId>('plates')
  const [take, setTake] = useState(0)
  const [folded, setFolded] = useState(false)

  const press = { treatment, pitch, paper: PAPER, take }
  const notes = [
    LAYOUTS.find((l) => l.id === layout)!.note,
    TREATMENTS.find((t) => t.id === treatment)!.note,
    IMAGERY.find((i) => i.id === imagery)!.note,
  ]

  return (
    <div className="sp" data-layout={layout}>
      {layout === 'home' && <HomeCell items={items} imagery={imagery} inkChoice={inkChoice} {...press} />}
      {layout === 'sheet' && <ContactSheet items={items} imagery={imagery} inkChoice={inkChoice} {...press} />}
      {layout === 'cut' && <Cut items={items} imagery={imagery} inkChoice={inkChoice} treatment={treatment} pitch={pitch} take={take} />}

      <aside className="hl-panel hl-corner sp-panel" aria-label="Screen print options" data-folded={folded || undefined}>
        <div className="hl-options" role="radiogroup" aria-label="Layout">
          {LAYOUTS.map((option) => (
            <button key={option.id} type="button" role="radio" aria-checked={option.id === layout} className="hl-chip" onClick={() => setLayout(option.id)}>
              {option.name}
            </button>
          ))}
          <button type="button" className="hl-chip hl-fold" onClick={() => setFolded((f) => !f)} aria-expanded={!folded}>
            {folded ? 'Print' : 'Hide'}
          </button>
        </div>
        <div className="hl-options" role="radiogroup" aria-label="Treatment">
          {TREATMENTS.map((option) => (
            <button key={option.id} type="button" role="radio" aria-checked={option.id === treatment} className="hl-chip" onClick={() => setTreatment(option.id)}>
              {option.name}
            </button>
          ))}
          <button type="button" className="hl-chip hl-replay" onClick={() => setTake((t) => t + 1)}>
            Reprint
          </button>
        </div>
        <div className="hl-options" role="radiogroup" aria-label="Ink">
          {INKS.map((option) => (
            <button key={option.id} type="button" role="radio" aria-checked={option.id === inkChoice} className="hl-chip" onClick={() => setInkChoice(option.id)}>
              {option.id !== 'discipline' && <span className="sp-swatch" data-ink={option.id} aria-hidden="true" />}
              {option.name}
            </button>
          ))}
        </div>
        <div className="hl-options">
          <span role="radiogroup" aria-label="Pitch" className="sp-set">
            {PITCHES.map((size) => (
              <button key={size} type="button" role="radio" aria-checked={size === pitch} className="hl-chip" onClick={() => setPitch(size)}>
                {size}px
              </button>
            ))}
          </span>
          <span role="radiogroup" aria-label="Imagery" className="sp-set">
            {IMAGERY.map((option) => (
              <button key={option.id} type="button" role="radio" aria-checked={option.id === imagery} className="hl-chip" onClick={() => setImagery(option.id)}>
                {option.name}
              </button>
            ))}
          </span>
        </div>
        <p className="hl-note">{notes.join(' ')}</p>
      </aside>
    </div>
  )
}

type PressProps = { items: WorkItem[]; imagery: ImageryId; inkChoice: InkId; treatment: Treatment; pitch: Pitch; paper: string; take: number }

/**
 * The live homepage with the print in its cover cell. Pointing at a work row
 * (or the cell) is what develops it, so the cell listens to the page rather
 * than to itself: the ruled index stays untouched.
 */
function HomeCell({ items, imagery, inkChoice, ...press }: PressProps) {
  const [pointed, setPointed] = useState(false)
  const [centred, setCentred] = useState(false)
  const hot = pointed || centred
  useCentred('.sp-home-cover', (indexes) => setCentred(indexes.length > 0))

  useEffect(() => {
    const update = (event: Event) => {
      const target = event.target instanceof Element ? event.target : null
      setPointed(!!target?.closest('#work .ri-link, .sp-home-cover'))
    }
    document.addEventListener('pointerover', update)
    document.addEventListener('focusin', update)
    return () => {
      document.removeEventListener('pointerover', update)
      document.removeEventListener('focusin', update)
    }
  }, [])

  return (
    <RuledIndex
      items={items}
      renderCover={(item, i) => (
        <figure className="sp-home-cover">
          <div className="ri-cover aspect-[3/2] md:aspect-[4/5]">
            <Print source={sourceOf(imagery, item.meta, item.cover, i)} hot={hot} label={item.meta.title} {...press} {...inkOf(inkChoice, item.meta)} />
          </div>
          <figcaption className="sp-spec t-label">
            <span>Plate — {indexLabel(i)}</span>
            <span className="text-ink-faint">{specOf(press.treatment, inkOf(inkChoice, item.meta).name, press.pitch)}</span>
          </figcaption>
        </figure>
      )}
    />
  )
}

/** All the covers as proofs: crop marks, a colour bar, and each plate's spec. */
function ContactSheet({ items, imagery, inkChoice, ...press }: PressProps) {
  const [hot, setHot] = useState<number | null>(null)
  const [centred, setCentred] = useState<number[]>([])
  useCentred('.sp-proof', setCentred)
  const inks = [...new Set(items.flatMap((item) => (press.treatment === 'twoink' ? [inkOf(inkChoice, item.meta).ink, inkOf(inkChoice, item.meta).ink2] : [inkOf(inkChoice, item.meta).ink])))]

  return (
    <section className="sp-sheet swiss-grid" aria-labelledby="sp-sheet-title">
      <p className="t-label col-span-full text-ink-faint md:col-span-3">Proofs · {items.length} plates</p>
      <h1 id="sp-sheet-title" className="sp-sheet-title col-span-full md:col-span-6">
        Work
      </h1>
      <div className="sp-bar col-span-full md:col-span-3" aria-label="Colour bar">
        <span className="sp-bar-patch" style={{ background: PAPER }} title={`Paper ${PAPER}`} />
        {inks.map((ink) => (
          <span key={ink} className="sp-bar-patch" style={{ background: ink }} title={ink} />
        ))}
        {[0.75, 0.5, 0.25].map((tint) => (
          <span key={tint} className="sp-bar-patch sp-bar-tint" style={{ '--tint': tint, '--bar-ink': inks[0] } as React.CSSProperties} />
        ))}
      </div>

      <ol className="sp-sheet-grid col-span-full">
        {items.map((item, i) => {
          const ink = inkOf(inkChoice, item.meta)
          const source = sourceOf(imagery, item.meta, item.cover, i)
          return (
            <li key={item.meta.slug}>
              <Link
                href={`/work/${item.meta.slug}`}
                transitionTypes={['nav-forward']}
                className="sp-proof"
                onPointerEnter={() => setHot(i)}
                onPointerLeave={() => setHot(null)}
                onFocus={() => setHot(i)}
                onBlur={() => setHot(null)}
              >
                <span className="sp-marks">
                  <Print source={source} hot={hot === i || centred.includes(i)} delay={i * 140} label={item.meta.title} {...press} {...ink} />
                </span>
                <span className="sp-proof-caption t-label">
                  <span>
                    {indexLabel(i)} {item.meta.title}
                  </span>
                  <span>{item.meta.year}</span>
                </span>
                <span className="sp-proof-meta t-label text-ink-faint">
                  <span>{item.meta.subtitle}</span>
                  <span>{specOf(press.treatment, ink.name, press.pitch)}</span>
                  {source.kind === 'url' && source.credit && <span className="sp-credit">{source.credit}</span>}
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/** A plate's spec line: treatment, ink, screen and pitch, as a proof would carry it. */
function specOf(treatment: Treatment, ink: string, pitch: number) {
  const t = TREATMENTS.find((option) => option.id === treatment)!
  return `${t.name} · ${treatment === 'twoink' ? `${ink} + 2nd` : ink} · ${t.spec} · ${pitch}px`
}
