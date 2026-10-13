'use client'

import { useState } from 'react'

import { DOT_FACES } from '../_dots/variants'
import {
  DEFAULT_STATE,
  MICRO_OPTIONS,
  MOTION_OPTIONS,
  TYPE_OPTIONS,
  type LabState,
  type MicroId,
  type MotionId,
  type TypeId,
} from './options'

function Source({ source }: { source?: { name: string; url: string } }) {
  if (!source) return null
  return (
    <a href={source.url} target="_blank" rel="noreferrer" className="lab-ref">
      {source.name} ↗
    </a>
  )
}

/** The lab's controls: one type pairing, one motion suite, any micro-interactions. */
export function LabDock({ state, onChange }: { state: LabState; onChange: (state: LabState) => void }) {
  const [open, setOpen] = useState(true)
  const toggleMicro = (id: MicroId) =>
    onChange({
      ...state,
      micro: state.micro.includes(id) ? state.micro.filter((m) => m !== id) : [...state.micro, id],
    })

  return (
    <aside className="lab-dock" data-open={open || undefined} aria-label="Home lab controls">
      <div className="lab-dock-head">
        <button type="button" className="lab-dock-toggle" aria-expanded={open} aria-controls="lab-dock-body" onClick={() => setOpen((o) => !o)}>
          Lab {open ? '–' : '+'}
        </button>
        {open ? (
          <button type="button" className="lab-dock-reset" onClick={() => onChange(DEFAULT_STATE)}>
            Reset
          </button>
        ) : null}
      </div>

      <div id="lab-dock-body" className="lab-dock-body" hidden={!open}>
        <fieldset>
          <legend>Type</legend>
          {TYPE_OPTIONS.map((o) => (
            <label key={o.id} className="lab-opt">
              <input
                type="radio"
                name="lab-type"
                id={`lab-type-${o.id}`}
                checked={state.type === o.id}
                onChange={() => onChange({ ...state, type: o.id as TypeId })}
              />
              <span>
                <b>{o.label}</b>
                <small>
                  {o.note} <Source source={o.ref} />
                </small>
              </span>
            </label>
          ))}
          {state.type === 'dot-matrix' ? (
            <label className="lab-sub">
              <span>Dot face</span>
              <select id="lab-dot-face" value={state.dot} onChange={(e) => onChange({ ...state, dot: e.target.value })}>
                {DOT_FACES.filter((f) => f.kind === 'font').map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </fieldset>

        <fieldset>
          <legend>Motion</legend>
          {MOTION_OPTIONS.map((o) => (
            <label key={o.id} className="lab-opt">
              <input
                type="radio"
                name="lab-motion"
                id={`lab-motion-${o.id}`}
                checked={state.motion === o.id}
                onChange={() => onChange({ ...state, motion: o.id as MotionId })}
              />
              <span>
                <b>{o.label}</b>
                <small>{o.note}</small>
              </span>
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend>Micro-interactions</legend>
          {MICRO_OPTIONS.map((o) => (
            <label key={o.id} className="lab-opt">
              <input type="checkbox" id={`lab-micro-${o.id}`} checked={state.micro.includes(o.id)} onChange={() => toggleMicro(o.id)} />
              <span>
                <b>{o.label}</b>
                <small>
                  {o.note} <Source source={o.ref} />
                </small>
              </span>
            </label>
          ))}
        </fieldset>
      </div>
    </aside>
  )
}
