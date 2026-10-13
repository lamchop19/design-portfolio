'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'

import { LandingFlight } from '@/components/landing/landing-flight'
import type { WorkItem } from '@/lib/work-items'

import { DOT_FACES, type FontFace } from '../_dots/variants'

import { LabDock } from './lab-dock'
import { altimeter } from './micro/altimeter'
import { cursor } from './micro/cursor'
import { decode } from './micro/decode'
import { highlights } from './micro/highlights'
import { magnetic } from './micro/magnetic'
import { scan } from './micro/scan'
import { stamp } from './micro/stamp'
import { spring } from './motion/spring'
import { DEFAULT_STATE, type LabState, type MicroId } from './options'
import './lab.css'

// The lab's settings, kept per visitor. Storage can be missing or blocked,
// so every read falls back to the live site's settings.
const KEY = 'home-lab'
const listeners = new Set<() => void>()
let cached: { raw: string | null; state: LabState } = { raw: null, state: DEFAULT_STATE }

function read(): LabState {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(KEY)
  } catch {}
  if (raw === cached.raw) return cached.state
  let state = DEFAULT_STATE
  try {
    state = raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : DEFAULT_STATE
  } catch {}
  cached = { raw, state }
  return state
}

export function writeLab(state: LabState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    cached = { raw: JSON.stringify(state), state }
  }
  listeners.forEach((fn) => fn())
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Enhancers that need code. Stretch headings is CSS only, keyed off the data attribute. */
const enhancers: Partial<Record<MicroId, (root: HTMLElement) => () => void>> = {
  decode,
  cursor,
  magnetic,
  highlights,
  scan,
  stamp,
  altimeter: () => altimeter(),
}

/**
 * The live homepage inside a switchable wrapper. Type pairings re-point the
 * font variables, motion suites retime or re-drive the existing elements,
 * and each micro-interaction attaches to the DOM LandingFlight already
 * renders. The live components are never edited.
 */
export function HomeLab({ items, fontVariables }: { items: WorkItem[]; fontVariables: string }) {
  const state = useSyncExternalStore(subscribe, read, () => DEFAULT_STATE)
  const root = useRef<HTMLDivElement>(null)
  const micro = state.micro.join(' ')
  const face = DOT_FACES.find((f): f is FontFace => f.kind === 'font' && f.id === state.dot)
  const dotVars = face
    ? ({ '--dm-family': face.family, '--dm-weight': face.weight, '--dm-axes': face.axes } as React.CSSProperties)
    : undefined

  useEffect(() => {
    const el = root.current
    if (!el) return
    const stops = state.micro.flatMap((id) => (enhancers[id] ? [enhancers[id](el)] : []))
    return () => stops.forEach((stop) => stop())
    // `micro` is the stable key for the list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [micro])

  useEffect(() => {
    const el = root.current
    if (!el || state.motion !== 'spring') return
    return spring(el)
  }, [state.motion])

  return (
    <>
      <div
        ref={root}
        className={`lab ${fontVariables}`}
        data-type={state.type}
        data-motion={state.motion}
        data-micro={micro || undefined}
        style={state.type === 'dot-matrix' ? dotVars : undefined}
      >
        <LandingFlight items={items} />
      </div>
      <LabDock state={state} onChange={writeLab} />
    </>
  )
}
