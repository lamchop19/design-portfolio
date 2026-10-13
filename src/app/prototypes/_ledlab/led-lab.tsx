'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Led } from '@/components/brand/led-matrix'
import { site } from '@/../content/site'

import {
  AMBIENTS,
  BOOT_MS,
  CLICKS,
  COLOUR_IDS,
  COLOURS,
  DEFAULTS,
  GLOWS,
  HOVERS,
  LEANS,
  LOAD_MS,
  LOADS,
  PALETTE_WORDS,
  PALETTES,
  SCENES,
  SURPRISES,
  type ClickId,
  type ColourId,
  type LabState,
  type Option,
} from './effects'
import {
  barcode,
  depart,
  fireworks,
  invert,
  life,
  nameMask,
  pattern,
  plane,
  rain,
  scanline,
  scatter,
  shockwave,
  twinkle,
  type Fx,
  type FxContext,
  type Point,
} from '@/components/brand/led-wordmark/fx'
import { LedFx, type FxHandle } from '@/components/brand/led-wordmark/fx-layer'
import { LedTape, padTo } from './led-tape'
import { randomGlyph, useReducedMotion, useScramble, useStrays } from './use-ticker'

import './ledlab.css'

const NAME = site.name.toUpperCase()
const COLS = NAME.length * 6 - 1
const ROWS = 7
const TRAIL = ['#4d8cff', 'var(--brand-pink)', 'var(--brand-green)']
const COLOUR_KEY = 'ledlab-colour'
/** Which word each letter belongs to, for per-word palettes. */
const WORD_OF = [...NAME].map((_, i) => NAME.slice(0, i).split(' ').length - 1)
/** The field and effects overlay reach this many lamps past the board on each side. */
const FIELD = { x: 12, y: 6 }
/** Pointer stillness before Rotation plays, in ms. */
const ROTATE_AFTER = 12_000

/** Click effects drawn on the overlay, by id. */
const OVERLAY_CLICKS: Partial<Record<ClickId, (origin: Point) => Fx>> = {
  plane,
  shockwave,
  pattern: () => pattern(),
  depart: () => depart(),
  scatter,
  fireworks,
  barcode: () => barcode(NAME),
  invert: () => invert(),
}

/** Idle effects drawn on the overlay, by id. */
const OVERLAY_IDLES = { scan: scanline, twinkle, life, rain } as const

const nyTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'America/New_York',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

const messages = () => ['NOW BOARDING', 'GATE 01A', 'DESIGNER', `NYC ${nyTime.format(new Date())}`]

/** Restarts a CSS animation keyed off an attribute by clearing it for a frame. */
function retrigger(el: Element | null, attr: string) {
  if (!el) return
  el.removeAttribute(attr)
  requestAnimationFrame(() => el.setAttribute(attr, ''))
}

/** Notes the time of the latest pointer activity, for Rotation. */
function markActive(ref: React.RefObject<number>) {
  ref.current = Date.now()
}

function randomLetter() {
  const letters = [...NAME].map((ch, i) => (ch === ' ' ? -1 : i)).filter((i) => i >= 0)
  return letters[Math.floor(Math.random() * letters.length)]
}

/**
 * The wordmark board with every effect wired to the lab's state. Remounted
 * (by key) to replay the load.
 */
function Board({ state, onColour }: { state: LabState; onColour: (id: ColourId) => void }) {
  const reduced = useReducedMotion()
  const boardRef = useRef<HTMLDivElement>(null)
  const fxRef = useRef<FxHandle>(null)
  const has = {
    hover: (id: string) => state.hover.includes(id as never),
    ambient: (id: string) => state.ambient.includes(id as never),
    scene: (id: string) => state.scene.includes(id as never),
  }
  const motion = !reduced
  const boot = motion && has.scene('boot') ? BOOT_MS : 0
  const load = motion ? state.load : 'none'

  const [settled, setSettled] = useState(load === 'none' && boot === 0)
  useEffect(() => {
    if (settled) return
    const timer = window.setTimeout(() => setSettled(true), boot + LOAD_MS[load])
    return () => clearTimeout(timer)
  }, [settled, boot, load])

  const words = PALETTE_WORDS[state.palette]
  const colourOf = useMemo(() => (words ? (i: number) => words[WORD_OF[i] % words.length] : undefined), [words])

  const scrambled = useScramble(NAME, load === 'cycle', boot)
  const [flicks, setFlicks] = useState<Record<number, string>>({})
  const text = [...scrambled].map((ch, i) => flicks[i] ?? ch).join('')

  const [tape, setTape] = useState<[string, string, string] | null>(() =>
    load === 'marquee' ? [' '.repeat(NAME.length), padTo('Welcome aboard', NAME.length), NAME] : null,
  )
  const messageIndex = useRef(0)
  const trailIndex = useRef(0)
  const lastActive = useRef(0)
  const [lean, setLean] = useState<number | null>(null)

  const strays = useStrays(
    motion && has.scene('field'),
    { cols: COLS + FIELD.x * 2, rows: ROWS + FIELD.y * 2 },
    { x: FIELD.x, y: FIELD.y, w: COLS, h: ROWS },
  )

  // What overlay effects need to know about the board, read fresh every tick.
  const mask = useMemo(() => nameMask(text), [text])
  const context = useRef<FxContext | null>(null)
  useEffect(() => {
    context.current = {
      cols: COLS,
      rows: ROWS,
      field: FIELD,
      lit: mask.set,
      litCells: mask.cells,
      colourAt: (x) => colourOf?.(Math.floor(x / 6)) ?? 'var(--lamp-on)',
    }
  })
  const getContext = useCallback(() => context.current, [])

  /** A letter ticks through a few random glyphs and back. */
  const flick = useCallback((i: number) => {
    for (let step = 0; step < 4; step++) {
      window.setTimeout(() => setFlicks((f) => ({ ...f, [i]: randomGlyph() })), step * 55)
    }
    window.setTimeout(
      () =>
        setFlicks((f) => {
          const next = { ...f }
          delete next[i]
          return next
        }),
      4 * 55,
    )
  }, [])

  const playMessage = useCallback(() => {
    const list = messages()
    setTape((current) => current ?? [NAME, padTo(list[messageIndex.current++ % list.length], NAME.length), NAME])
  }, [])

  // Overlay idle effects: one track each, started once the load has settled.
  useEffect(() => {
    const fx = fxRef.current
    if (!fx) return
    for (const [id, make] of Object.entries(OVERLAY_IDLES)) {
      const track = `idle:${id}`
      const on = motion && settled && state.ambient.includes(id as never)
      if (on && !fx.busy(track)) fx.play(track, make())
      if (!on) fx.stop(track)
    }
  }, [motion, settled, state.ambient])

  // Failing bulb: now and then one letter buzzes, in both the lit and glow layers.
  const buzz = motion && settled && has.ambient('buzz')
  useEffect(() => {
    if (!buzz) return
    let timer = 0
    const schedule = () => {
      timer = window.setTimeout(
        () => {
          const i = randomLetter()
          const groups = boardRef.current?.querySelectorAll(`.ll-main .led-glyph[data-i="${i}"]`) ?? []
          groups.forEach((g) => g.setAttribute('data-buzz', ''))
          window.setTimeout(() => groups.forEach((g) => g.removeAttribute('data-buzz')), 900)
          schedule()
        },
        1800 + Math.random() * 2600,
      )
    }
    schedule()
    return () => clearTimeout(timer)
  }, [buzz])

  // Tile refresh: every few seconds one letter re-ticks.
  const refresh = motion && settled && has.ambient('refresh')
  useEffect(() => {
    if (!refresh) return
    let timer = 0
    const schedule = () => {
      timer = window.setTimeout(
        () => {
          flick(randomLetter())
          schedule()
        },
        3500 + Math.random() * 4000,
      )
    }
    schedule()
    return () => clearTimeout(timer)
  }, [refresh, flick])

  // Rotation: once the pointer has been still for a while, play the next info line.
  const rotate = motion && settled && has.ambient('rotate')
  useEffect(() => {
    if (!rotate) return
    lastActive.current = Date.now()
    const timer = window.setInterval(() => {
      if (Date.now() - lastActive.current < ROTATE_AFTER) return
      lastActive.current = Date.now()
      playMessage()
    }, 1000)
    return () => clearInterval(timer)
  }, [rotate, playMessage])

  const onGlyphEnter = useCallback(
    (i: number, svg: SVGSVGElement) => {
      if (!motion) return
      if (state.hover.includes('ripple')) {
        svg.style.setProperty('--hx', String(i * 6 + 2))
        retrigger(svg, 'data-ripple')
      }
      if (state.hover.includes('trail')) {
        const colour = TRAIL[trailIndex.current++ % TRAIL.length]
        svg.querySelectorAll<SVGGElement>(`.led-glyph[data-i="${i}"]`).forEach((g) => {
          g.style.setProperty('--tint', colour)
          g.setAttribute('data-tint', '')
          requestAnimationFrame(() => requestAnimationFrame(() => g.removeAttribute('data-tint')))
        })
      }
      if (state.hover.includes('flick')) flick(i)
      if (state.lean !== 'none') setLean(i)
    },
    [motion, state.hover, state.lean, flick],
  )

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    markActive(lastActive)
    if (!has.hover('torch')) return
    const svg = boardRef.current?.querySelector<SVGSVGElement>('.ll-main')
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    svg.style.setProperty('--px', String(((event.clientX - rect.left) / rect.width) * COLS - 0.5))
    svg.style.setProperty('--py', String(((event.clientY - rect.top) / rect.height) * ROWS - 0.5))
  }

  const onPointerLeave = () => {
    boardRef.current?.querySelector<SVGSVGElement>('.ll-main')?.style.setProperty('--px', '-99')
    setLean(null)
  }

  /** Where on the board a click landed, in lamps; the centre for keyboard presses. */
  const clickPoint = (event?: React.MouseEvent): Point => {
    const svg = boardRef.current?.querySelector<SVGSVGElement>('.ll-main')
    if (!event || !svg || event.detail === 0) return { x: COLS / 2, y: ROWS / 2 }
    const rect = svg.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * COLS - 0.5,
      y: ((event.clientY - rect.top) / rect.height) * ROWS - 0.5,
    }
  }

  const onClick = (event?: React.MouseEvent) => {
    markActive(lastActive)
    if (state.click === 'colour') {
      const next = COLOUR_IDS[(COLOUR_IDS.indexOf(state.colour) + 1) % COLOUR_IDS.length]
      onColour(next)
      try {
        localStorage.setItem(COLOUR_KEY, next)
      } catch {
        // Still cycles for this visit.
      }
      return
    }
    if (!motion || tape || fxRef.current?.busy('click')) return
    const kind = state.click === 'surprise' ? SURPRISES[Math.floor(Math.random() * SURPRISES.length)] : state.click
    const overlay = OVERLAY_CLICKS[kind]
    if (overlay) fxRef.current?.play('click', overlay(clickPoint(event)))
    else if (kind === 'flash') retrigger(boardRef.current, 'data-flash')
    else if (kind === 'wave') retrigger(boardRef.current, 'data-wave')
    else if (kind === 'message') playMessage()
  }

  const clickable = state.click !== 'none'

  return (
    <div
      ref={boardRef}
      className="ll-board"
      data-load={settled ? undefined : load}
      data-lightbox={has.scene('lightbox') || undefined}
      data-glow={state.glow}
      data-core={has.scene('core') || undefined}
      data-decay={has.scene('decay') || undefined}
      data-torch={has.hover('torch') || undefined}
      data-breathe={(settled && has.ambient('breathe')) || undefined}
      data-size={(settled && has.ambient('size')) || undefined}
      data-drift={(settled && has.ambient('drift')) || undefined}
      data-clickable={clickable || undefined}
      style={
        {
          '--cols': COLS,
          '--boot': `${boot}ms`,
          '--lamp-on': COLOURS[state.colour].value,
        } as React.CSSProperties
      }
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onClick={clickable ? onClick : undefined}
      onKeyDown={clickable ? (event) => (event.key === 'Enter' || event.key === ' ') && onClick() : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? `${site.name} — click to play` : undefined}
    >
      {boot ? (
        <div className="ll-boot t-label" aria-hidden="true">
          <p>Board 01 · self test ok</p>
          <p>Lamps {NAME.length * 35} · warming up …</p>
        </div>
      ) : null}

      {has.scene('spill') ? <div className="ll-spill" aria-hidden="true" /> : null}

      {has.scene('field') ? (
        <div className="ll-field" aria-hidden="true">
          {strays.map((s) => (
            <span
              key={s.id}
              className="ll-stray"
              style={{ '--x': s.x, '--y': s.y, '--stray': s.colour } as React.CSSProperties}
            />
          ))}
        </div>
      ) : null}

      {tape ? (
        <LedTape
          lines={tape}
          glow={state.glow}
          delay={settled ? 0 : boot}
          onDone={() => setTape(null)}
          className="ll-main"
        />
      ) : (
        <Led
          text={text}
          label={site.name}
          sweep={false}
          relight={motion && has.hover('relight')}
          glow={state.glow}
          bold={state.lean === 'bold' ? (i) => i === lean : undefined}
          glyphProps={(i) => {
            const colour = colourOf?.(i)
            const leaning = state.lean === 'italic' && i === lean
            if (!colour && !leaning) return undefined
            return {
              ...(leaning ? { 'data-lean': '' } : {}),
              ...(colour ? { style: { '--lamp-on': colour } as React.CSSProperties } : {}),
            }
          }}
          onGlyphEnter={onGlyphEnter}
          className="ll-main"
        />
      )}

      <LedFx
        ref={fxRef}
        getContext={getContext}
        boardRef={boardRef}
        cols={COLS}
        rows={ROWS}
        field={FIELD}
        glow={state.glow !== 'none'}
        className="ll-fx"
      />

      {settled && has.ambient('glint') ? <div className="ll-glint" aria-hidden="true" /> : null}

      {load === 'rgb' && !settled ? (
        <div className="ll-rgb" aria-hidden="true">
          {['pink', 'blue', 'green'].map((channel) => (
            <Led key={channel} text={NAME} label={null} ghost={false} sweep={false} className={`ll-rgb-${channel}`} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function Segmented<Id extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Option<Id>[]
  value: Id
  onChange: (id: Id) => void
}) {
  return (
    <fieldset className="ll-group">
      <legend className="t-label text-ink-faint">{label}</legend>
      <div className="ll-options" role="radiogroup">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={value === option.id}
            className="ll-chip"
            title={option.note}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function Checks<Id extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Option<Id>[]
  value: Id[]
  onChange: (ids: Id[]) => void
}) {
  return (
    <fieldset className="ll-group">
      <legend className="t-label text-ink-faint">{label}</legend>
      <div className="ll-options">
        {options.map((option) => {
          const on = value.includes(option.id)
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={on}
              className="ll-chip"
              title={option.note}
              onClick={() => onChange(on ? value.filter((id) => id !== option.id) : [...value, option.id])}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

/** Notes for whatever is switched on, so the page explains itself. */
function Notes({ state }: { state: LabState }) {
  const active: Option[] = [
    CLICKS.find((o) => o.id === state.click)!,
    ...AMBIENTS.filter((o) => state.ambient.includes(o.id)),
    GLOWS.find((o) => o.id === state.glow)!,
    ...(state.palette === 'mono' ? [] : [PALETTES.find((o) => o.id === state.palette)!]),
    ...SCENES.filter((o) => state.scene.includes(o.id)),
    LOADS.find((o) => o.id === state.load)!,
    ...HOVERS.filter((o) => state.hover.includes(o.id)),
    ...(state.lean === 'none' ? [] : [LEANS.find((o) => o.id === state.lean)!]),
  ]
  return (
    <ul className="ll-notes">
      {active.map((option) => (
        <li key={option.id}>
          <span className="t-label">{option.label}</span>
          <span className="text-ink-muted">
            {option.note}
            {option.ref ? (
              <>
                {' '}
                <a href={option.ref.url} target="_blank" rel="noreferrer" className="ll-ref">
                  Ref: {option.ref.name} ↗
                </a>
              </>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  )
}

/**
 * Glow, colour and motion treatments for the LED wordmark on the dark board,
 * all switchable at full size. Changing the load, or pressing replay, remounts
 * the board so the load plays again.
 */
export function LedLab() {
  const [state, setState] = useState<LabState>(DEFAULTS)
  const [run, setRun] = useState(0)
  const set = <K extends keyof LabState>(key: K) => (value: LabState[K]) => setState((s) => ({ ...s, [key]: value }))

  // A colour chosen by clicking the board comes back on the next visit.
  useEffect(() => {
    let saved: string | null = null
    try {
      saved = localStorage.getItem(COLOUR_KEY)
    } catch {}
    if (saved && saved in COLOURS) {
      const colour = saved as ColourId
      queueMicrotask(() => setState((s) => ({ ...s, colour })))
    }
  }, [])

  const replay = () => setRun((r) => r + 1)

  return (
    <div className="ll-page">
      <div className="ll-stage">
        <div className="ll-inner">
          <Board key={`${run}-${state.load}-${state.scene.includes('boot')}`} state={state} onColour={set('colour')} />
          <div
            className="ll-board ll-small"
            data-core={state.scene.includes('core') || undefined}
            style={{ '--lamp-on': COLOURS[state.colour].value } as React.CSSProperties}
          >
            <Led text="TN25 · GATE 01A" label={null} sweep={false} glow={state.glow} />
          </div>
        </div>
      </div>

      <header className="swiss-grid items-end gap-y-4 pt-10 pb-8">
        <div className="col-span-full grid gap-3 md:col-span-8">
          <p className="t-label text-ink-faint">Wordmark · LED lab</p>
          <h1 className="font-display text-[clamp(2.25rem,6vw,4.75rem)] leading-[0.92] tracking-[-0.04em]">
            Lamps after dark
          </h1>
          <p className="max-w-[62ch] text-ink-muted">
            Glow, colour and motion for the board, at the wordmark’s real size. Click the name to play the click
            effect, hover it for the hover ones, and leave it alone for the idle ones.
          </p>
        </div>
        <div className="col-span-full flex flex-wrap items-center gap-3 md:col-span-4 md:justify-end">
          <button type="button" className="ll-chip" onClick={replay}>
            Replay load ↺
          </button>
          <button type="button" className="ll-chip" onClick={() => setState(DEFAULTS)}>
            Reset
          </button>
        </div>
      </header>

      <div className="swiss-grid gap-y-8 pb-24">
        <div className="col-span-full grid content-start gap-6 md:col-span-7">
          <Segmented label="On click" options={CLICKS} value={state.click} onChange={set('click')} />
          <Checks label="Idle" options={AMBIENTS} value={state.ambient} onChange={set('ambient')} />
          <Segmented label="Glow" options={GLOWS} value={state.glow} onChange={set('glow')} />
          <Segmented
            label="Lamp colour"
            options={COLOUR_IDS.map((id) => ({ id, label: COLOURS[id].label, note: '' }))}
            value={state.colour}
            onChange={set('colour')}
          />
          <Segmented label="Palette" options={PALETTES} value={state.palette} onChange={set('palette')} />
          <Checks label="Board" options={SCENES} value={state.scene} onChange={set('scene')} />
          <Segmented label="On load" options={LOADS} value={state.load} onChange={set('load')} />
          <Checks label="On hover" options={HOVERS} value={state.hover} onChange={set('hover')} />
          <Segmented label="Letter under the pointer" options={LEANS} value={state.lean} onChange={set('lean')} />
        </div>
        <div className="col-span-full md:col-span-5">
          <p className="t-label mb-3 text-ink-faint">What’s on</p>
          <Notes state={state} />
        </div>
      </div>
    </div>
  )
}
