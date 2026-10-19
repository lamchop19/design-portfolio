import type { WorkMeta } from '@/lib/content'

/** The three disciplines, each with its brand colour and an ink that reads on it. */
export const disciplines = {
  Brand: { fill: 'var(--brand-blue)', ink: '#ffffff' },
  Social: { fill: 'var(--brand-pink)', ink: '#0a0f1f' },
  Content: { fill: 'var(--brand-green)', ink: '#0a0f1f' },
} as const

export type Discipline = keyof typeof disciplines

/** Which disciplines a project covers, from its discipline line and tags. Anything not brand or social is content. */
export function disciplinesOf(meta: WorkMeta): Discipline[] {
  const words = [meta.subtitle, ...meta.tags].join(' ').toLowerCase()
  const found: Discipline[] = []
  if (words.includes('brand')) found.push('Brand')
  if (words.includes('social')) found.push('Social')
  return found.length ? found : ['Content']
}
