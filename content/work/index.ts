import type { WorkMeta } from '@/lib/content'

import { meta as nyuSydney } from './nyu-sydney/meta'
import { meta as shmeel } from './shmeel/meta'
import { meta as startupWeek } from './startup-week/meta'
import { meta as techNyu } from './tech-nyu/meta'

/**
 * The work index. Add a project by creating content/work/<slug>/{meta.ts,body.mdx}
 * and importing its meta here — `npm run new-project` does both.
 */
const all: WorkMeta[] = [techNyu, startupWeek, nyuSydney, shmeel]

/**
 * Published work in the order it appears on the site. This is a curated running
 * order, not a computed one — reorder the `all` array above to change it.
 */
export const work: WorkMeta[] = all.filter((w) => !w.draft)

export function getWork(slug: string): WorkMeta | undefined {
  return work.find((w) => w.slug === slug)
}

/** Wraps around, so the last case study points back at the first. */
export function getNextWork(slug: string): WorkMeta | undefined {
  const i = work.findIndex((w) => w.slug === slug)
  if (i === -1) return undefined
  return work[(i + 1) % work.length]
}
