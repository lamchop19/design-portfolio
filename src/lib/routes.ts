import type { WorkMeta } from '@/lib/content'

/** The three routes, each with its sign colour and an ink that reads on it. */
export const routes = {
  Brand: { fill: 'var(--brand-blue)', ink: '#ffffff' },
  Social: { fill: 'var(--brand-pink)', ink: '#0a0f1f' },
  Content: { fill: 'var(--brand-green)', ink: '#0a0f1f' },
} as const

export type Route = keyof typeof routes

/** Which routes a project flies, from its discipline line and tags. Anything not brand or social is content. */
export function routesOf(meta: WorkMeta): Route[] {
  const words = [meta.subtitle, ...meta.tags].join(' ').toLowerCase()
  const found: Route[] = []
  if (words.includes('brand')) found.push('Brand')
  if (words.includes('social')) found.push('Social')
  return found.length ? found : ['Content']
}
