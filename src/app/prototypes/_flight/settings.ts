'use client'

import { useSyncExternalStore } from 'react'

import { FLAP_LAND_MS, FLAP_STEP_MS, flapEases, type FlapEase, type FlapMotion } from '@/lib/flap-motion'

/**
 * Prototype switches shared by the Flight pages and the flip lab, kept in
 * localStorage so a choice made in one carries to the others.
 */
export type ChromeDensity = 'full' | 'lean' | 'minimal'
export type FlipChoice = 'stock' | FlapEase

export type ProtoSettings = {
  ui: ChromeDensity
  flip: FlipChoice
  /** Multiplier on the stock flip durations. */
  speed: number
  /** Bumped to replay the wordmark; not stored. */
  replay: number
}

const KEY = 'flight-prototype'
const DEFAULTS: ProtoSettings = { ui: 'lean', flip: 'expo', speed: 2, replay: 0 }

export const densities: Array<[ChromeDensity, string]> = [
  ['full', 'Full'],
  ['lean', 'Lean'],
  ['minimal', 'Minimal'],
]
export const flips: Array<[FlipChoice, string]> = [
  ['stock', 'Stock'],
  ...(Object.keys(flapEases) as FlapEase[]).map((key): [FlipChoice, string] => [key, flapEases[key].label]),
]
export const speeds = [1, 1.5, 2, 3]

let current: ProtoSettings | null = null
const listeners = new Set<() => void>()

function read(): ProtoSettings {
  if (current) return current
  let stored: Partial<ProtoSettings> = {}
  try {
    stored = JSON.parse(localStorage.getItem(KEY) ?? '{}')
  } catch {}
  current = { ...DEFAULTS, ...stored, replay: 0 }
  return current
}

export function updateSettings(patch: Partial<ProtoSettings>) {
  const { replay, ...rest } = { ...read(), ...patch }
  current = { ...rest, replay }
  try {
    localStorage.setItem(KEY, JSON.stringify(rest))
  } catch {}
  listeners.forEach((fn) => fn())
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

export function useSettings() {
  return useSyncExternalStore(subscribe, read, () => DEFAULTS)
}

/** Flip timing for a choice of curve and speed. `slow` stretches it further for slow motion. */
export function motionFor(flip: FlipChoice, speed: number, slow = 1): FlapMotion {
  return {
    step: FLAP_STEP_MS * speed * slow,
    land: FLAP_LAND_MS * speed * slow,
    ease: flip === 'stock' ? undefined : flapEases[flip].fn,
  }
}
