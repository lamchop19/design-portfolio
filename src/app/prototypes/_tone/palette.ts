import type { CSSProperties } from 'react'

/**
 * One hue per project, worked into a takeover palette. The hero floods in the
 * project's full-strength colour with type in another tone of the same hue;
 * the reading section drops to a pale tint (dark: a near-black shade) so the
 * prose keeps body-text contrast. Every text/ground pair here clears 4.5:1
 * (blue's hero is the tightest, at 4.9:1).
 *
 * Keyed by slug rather than added to the content schema: if this direction
 * wins, the values move into `meta.ts` as a `color` field.
 */
export type Tone = {
  /** The takeover ground and the type set on it. */
  hero: string
  heroInk: string
  /** Light reading ground, its raised surface, body ink and secondary ink. */
  tint: string
  tintRaised: string
  deep: string
  mid: string
  ruleLight: string
  /** Dark reading ground, its raised surface, body ink and secondary ink. */
  deeper: string
  deeperRaised: string
  pale: string
  paleMid: string
  ruleDark: string
}

const blue: Tone = {
  hero: '#0059ff',
  heroInk: '#f0f4ff',
  tint: '#dbe6ff',
  tintRaised: '#c9d9ff',
  deep: '#001a66',
  mid: '#3a4f8c',
  ruleLight: '#a9c0f5',
  deeper: '#000a2e',
  deeperRaised: '#0a1a4a',
  pale: '#dbe6ff',
  paleMid: '#9bb8ff',
  ruleDark: '#22356e',
}

const pink: Tone = {
  hero: '#f551ab',
  heroInk: '#2e0319',
  tint: '#fde3f1',
  tintRaised: '#fbd0e7',
  deep: '#5c0a36',
  mid: '#8a2a5e',
  ruleLight: '#f2b3d4',
  deeper: '#2e0319',
  deeperRaised: '#44082a',
  pale: '#fde3f1',
  paleMid: '#f7a8d2',
  ruleDark: '#5e1a40',
}

const green: Tone = {
  hero: '#81db89',
  heroInk: '#05260a',
  tint: '#e1f7e3',
  tintRaised: '#cdf0d1',
  deep: '#0e4a17',
  mid: '#2c6a35',
  ruleLight: '#a9dcb0',
  deeper: '#05260a',
  deeperRaised: '#0c3a13',
  pale: '#e1f7e3',
  paleMid: '#a9e8ae',
  ruleDark: '#1d4f25',
}

const teal: Tone = {
  hero: '#10364b',
  heroInk: '#d6eaf3',
  tint: '#e3f0f6',
  tintRaised: '#cfe3ec',
  deep: '#0a2230',
  mid: '#2f5d75',
  ruleLight: '#a9c9d8',
  deeper: '#05131b',
  deeperRaised: '#0c2230',
  pale: '#d6eaf3',
  paleMid: '#9cc7da',
  ruleDark: '#1f3f50',
}

const bySlug: Record<string, Tone> = {
  'tech-nyu': blue,
  'startup-week': pink,
  'nyu-sydney': green,
  shmeel: teal,
}

const fallback = [blue, pink, green, teal]

export function toneFor(slug: string, index: number): Tone {
  return bySlug[slug] ?? fallback[index % fallback.length]
}

/**
 * Re-points the site tokens at the tone, so everything inside (the MDX prose,
 * the boarding-pass rail) recolours without knowing about it. `light-dark()`
 * follows the page's color-scheme, which the theme toggle already drives.
 */
export function toneVars(tone: Tone): CSSProperties {
  return {
    '--tt-hero': tone.hero,
    '--tt-hero-ink': tone.heroInk,
    '--surface': `light-dark(${tone.tint}, ${tone.deeper})`,
    '--surface-raised': `light-dark(${tone.tintRaised}, ${tone.deeperRaised})`,
    '--ink': `light-dark(${tone.deep}, ${tone.pale})`,
    '--ink-muted': `light-dark(${tone.deep}, ${tone.pale})`,
    '--ink-faint': `light-dark(${tone.mid}, ${tone.paleMid})`,
    '--rule': `light-dark(${tone.ruleLight}, ${tone.ruleDark})`,
    '--accent': `light-dark(${tone.mid}, ${tone.paleMid})`,
  } as CSSProperties
}
