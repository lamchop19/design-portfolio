'use client'

import { useState } from 'react'

import { type Blend, GROUNDS, type GroundStyle, type IdleStyle, SCHOOL_LOOK, type SchoolLook, type Swim } from './fish-gl'

/** Where the logo, sentence and menu sit. Keys 1–6 switch between them. Phones always get Centred. */
export const LAYOUTS = [
  ['centred', 'Centred'],
  ['index', 'Index'],
  ['column', 'Column'],
  ['bar', 'Lower third'],
  ['masthead', 'Masthead'],
  ['corners', 'Corners'],
] as const
export type Layout = (typeof LAYOUTS)[number][0]

const LAYOUT_NOTES: Record<Layout, string> = {
  centred: 'Your sketch: everything stacked in the middle, the menu in a row.',
  index: 'After jadefranson.com: the mark top left, a numbered menu bottom left, the sentence bottom right.',
  column: 'One left-aligned column, centred on the height, leaving the right of the screen to the water.',
  bar: 'Everything on one band along the bottom, like a TV’s lower third; the water above is open.',
  masthead: 'A big mark at the top with the sentence under it, and the menu spread along the bottom edge.',
  corners: 'Mark top left, menu top right like a nav bar, and the sentence set large bottom left as a statement.',
}

/** Starting points: light grounds only, like the site. */
export const SCHOOL_PRESETS: { name: string; look: Partial<SchoolLook> }[] = [
  { name: 'Shallows', look: {} },
  { name: 'Open water', look: { ground: ['#e3f0fa', '#7fa8d6'], groundStyle: 'open', light: 0.6, particles: 0.7, blend: 'paint' } },
  { name: 'Seabed', look: { ground: ['#eaf6f6', '#8ec1c9'], fish: ['#ff6b5a', '#ffc65c', '#4b62e8'], groundStyle: 'seabed', light: 0.5, particles: 0.6, blend: 'paint' } },
  { name: 'Blank', look: { ground: ['#ffffff', '#ffffff'], groundStyle: 'blank', blend: 'multiply', grain: 0 } },
  { name: 'Shoal', look: { ground: ['#f7f8fc', '#e2e8f7'], groundStyle: 'columns', blend: 'multiply' } },
  { name: 'Lagoon', look: { ground: ['#f3fbfb', '#cdeef0'], fish: ['#ff7a59', '#ffd166', '#118ab2'], groundStyle: 'columns', blend: 'multiply' } },
  { name: 'Coral', look: { ground: ['#fff7f2', '#ffe0d2'], fish: ['#ff4f6d', '#ff9f1c', '#2ec4b6'], groundStyle: 'wash', blend: 'multiply' } },
  { name: 'Credits', look: { ground: ['#f6f4ff', '#d9d3f7'], fish: ['#ff4f9e', '#ffd08a', '#ff2b22'], groundStyle: 'columns', blend: 'paint' } },
  { name: 'Riso', look: { ground: ['#fbfaf7', '#ebe8e0'], fish: ['#0059ff', '#ff48b0', '#ffe14d'], groundStyle: 'wash', blend: 'multiply', grain: 0.5 } },
  { name: 'Smear', look: { ground: ['#f7f8fc', '#dfe6f6'], groundStyle: 'smear', blend: 'multiply' } },
]

type NumKey = { [K in keyof SchoolLook]: SchoolLook[K] extends number ? K : never }[keyof SchoolLook]
type Slider = { k: NumKey; label: string; min: number; max: number; step: number; fmt?: (v: number) => string }

const whole = (v: number) => String(Math.round(v))
const FISH: Slider[] = [
  { k: 'start', label: 'Fish on arrival', min: 0, max: 30, step: 1, fmt: whole },
  { k: 'perClick', label: 'Added per click', min: 1, max: 6, step: 1, fmt: whole },
  { k: 'most', label: 'Most before a click clears them', min: 2, max: 30, step: 1, fmt: whole },
  { k: 'size', label: 'Size', min: 0.01, max: 0.09, step: 0.001, fmt: (v) => `${(v * 100).toFixed(1)}%` },
  { k: 'speed', label: 'Speed', min: 0.05, max: 1.2, step: 0.01 },
  { k: 'activity', label: 'Activity', min: 0, max: 1, step: 0.01 },
  { k: 'spread', label: 'Spread round the cursor', min: 0, max: 1, step: 0.01 },
  { k: 'smear', label: 'Trails', min: 0, max: 1, step: 0.01 },
]
const SHAPE: Slider[] = [
  { k: 'abstract', label: 'Abstract', min: 0, max: 1, step: 0.01 },
  { k: 'variety', label: 'Variety', min: 0, max: 1, step: 0.01 },
  { k: 'depth', label: 'Body depth', min: 0.2, max: 0.9, step: 0.01 },
  { k: 'tail', label: 'Tail', min: 0, max: 1.6, step: 0.01 },
  { k: 'soft', label: 'Softness', min: 0, max: 1, step: 0.01 },
]
const GROUND: Slider[] = [
  { k: 'light', label: 'Light (columns, rays, caustics)', min: 0, max: 1, step: 0.01 },
  { k: 'particles', label: 'Drift (snow, bubbles, kelp)', min: 0, max: 1, step: 0.01 },
  { k: 'grain', label: 'Grain', min: 0, max: 1, step: 0.01 },
  { k: 'clearingStrength', label: 'Clearing behind the type', min: 0, max: 1, step: 0.01 },
]

function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="sp-field">
      <span className="sp-label">{label}</span>
      <div className="hl-options" role="radiogroup" aria-label={label}>
        {options.map(([v, name]) => (
          <button key={v} type="button" role="radio" aria-checked={value === v} className="hl-chip" onClick={() => onChange(v)}>
            {name}
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * The School lab's controls, folded into the bottom-right corner: presets,
 * the fish (how many, how big, how they move), their shape, and the ground and
 * paper clearing. Copy puts the settings on the clipboard to bake in later.
 */
export function SchoolPanel({
  look,
  preset,
  count,
  layout,
  onLayout,
  onLook,
  onPreset,
  onReplay,
  onReset,
}: {
  look: SchoolLook
  preset: string | null
  /** Fish swimming now. */
  count: number
  layout: Layout
  onLayout: (layout: Layout) => void
  onLook: (patch: Partial<SchoolLook>) => void
  onPreset: (name: string) => void
  onReplay: () => void
  onReset: () => void
}) {
  const [folded, setFolded] = useState(false)
  const [copied, setCopied] = useState(false)

  const slider = (s: Slider) => (
    <label key={s.k} className="sp-slider">
      <span className="sp-label">{s.label}</span>
      <output>{s.fmt ? s.fmt(look[s.k]) : look[s.k].toFixed(2)}</output>
      <input type="range" min={s.min} max={s.max} step={s.step} value={look[s.k]} onChange={(e) => onLook({ [s.k]: Number(e.target.value) })} />
    </label>
  )
  const colour = (label: string, value: string, set: (v: string) => void) => (
    <label key={label} className="sp-colour">
      <span className="sp-label">{label}</span>
      <input type="color" value={value} onChange={(e) => set(e.target.value)} />
    </label>
  )

  const copy = () => {
    navigator.clipboard?.writeText(JSON.stringify(look, null, 2)).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1800)
      },
      () => {},
    )
  }

  return (
    <div className="hl-panel hl-corner school-panel" data-folded={folded || undefined}>
      <div className="hl-options">
        <button type="button" className="hl-chip hl-fold" aria-expanded={!folded} onClick={() => setFolded((f) => !f)}>
          {folded ? 'Fish controls' : 'Hide'}
        </button>
        {!folded && (
          <>
            <button type="button" className="hl-chip" onClick={onReplay}>
              Replay intro
            </button>
            <button type="button" className="hl-chip" onClick={copy}>
              {copied ? 'Copied' : 'Copy settings'}
            </button>
            <button type="button" className="hl-chip" onClick={onReset}>
              Reset
            </button>
          </>
        )}
      </div>

      {!folded && (
        <div className="sp-body">
          <section>
            <h2 className="sp-head">Layout · keys 1–6</h2>
            <div className="hl-options" role="radiogroup" aria-label="Layout">
              {LAYOUTS.map(([id, name]) => (
                <button key={id} type="button" role="radio" aria-checked={layout === id} className="hl-chip" onClick={() => onLayout(id)}>
                  {name}
                </button>
              ))}
            </div>
            <p className="sp-note">{LAYOUT_NOTES[layout]}</p>
          </section>

          <section>
            <h2 className="sp-head">Presets</h2>
            <div className="hl-options" role="radiogroup" aria-label="Presets">
              {SCHOOL_PRESETS.map((p) => (
                <button key={p.name} type="button" role="radio" aria-checked={preset === p.name} className="hl-chip" onClick={() => onPreset(p.name)}>
                  {p.name}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="sp-head">Fish</h2>
            <Seg<Swim>
              label="School"
              value={look.swim}
              options={[
                ['follow', 'Follows the cursor'],
                ['pass', 'Passes by'],
              ]}
              onChange={(swim) => onLook({ swim })}
            />
            {look.swim === 'pass' && slider({ k: 'passGap', label: 'Time between passes', min: 0, max: 20, step: 0.5, fmt: (v) => `${v}s` })}
            <p className="sp-note">
              {count} swimming. Click the water to add {look.perClick === 1 ? 'one' : look.perClick}; at {look.most} the next click clears them.
            </p>
            {FISH.map(slider)}
          </section>

          <section>
            <h2 className="sp-head">Shape</h2>
            {SHAPE.map(slider)}
            <Seg label="Eyes" value={look.eyes ? 'on' : 'off'} options={[['on', 'On'], ['off', 'Off']]} onChange={(v) => onLook({ eyes: v === 'on' })} />
          </section>

          <section>
            <h2 className="sp-head">Colour</h2>
            <div className="sp-colours">
              {look.fish.map((c, i) =>
                colour(`Fish ${'ABC'[i]}`, c, (v) => {
                  const fish = [...look.fish] as SchoolLook['fish']
                  fish[i] = v
                  onLook({ fish })
                }),
              )}
            </div>
            <Seg<Blend> label="Where fish overlap" value={look.blend} options={[['multiply', 'Mix like ink'], ['paint', 'Paint over']]} onChange={(blend) => onLook({ blend })} />
            <div className="sp-colours">
              {colour('Ground', look.ground[0], (v) => onLook({ ground: [v, look.ground[1]] }))}
              {colour('Ground shade', look.ground[1], (v) => onLook({ ground: [look.ground[0], v] }))}
              {colour('Clearing', look.clearing, (clearing) => onLook({ clearing }))}
            </div>
            <Seg<GroundStyle> label="Ground" value={look.groundStyle} options={GROUNDS} onChange={(groundStyle) => onLook({ groundStyle })} />
            {GROUND.filter(
              (s) =>
                (s.k !== 'particles' || ['shallows', 'open', 'seabed'].includes(look.groundStyle)) &&
                (s.k !== 'light' || !['wash', 'smear', 'blank'].includes(look.groundStyle)),
            ).map(slider)}
          </section>

          <section>
            <h2 className="sp-head">When nobody&rsquo;s there</h2>
            <Seg<IdleStyle>
              label="Idle look"
              value={look.idleStyle}
              options={[
                ['ambient', 'Ambient'],
                ['tv', 'TV'],
              ]}
              onChange={(idleStyle) => onLook({ idleStyle })}
            />
            {slider({ k: 'idleAfter', label: 'Goes idle after', min: 1, max: 15, step: 0.5, fmt: (v) => `${v}s` })}
          </section>
        </div>
      )}
    </div>
  )
}

export const presetLook = (name: string): SchoolLook => ({ ...SCHOOL_LOOK, ...(SCHOOL_PRESETS.find((p) => p.name === name)?.look ?? {}) })
