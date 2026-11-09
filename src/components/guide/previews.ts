import type { SectionId } from '@/lib/guide'
import { site } from '@/../content/site'
import { work } from '@/../content/work'

/** What a section holds, for layouts that show it beside the menu: a count, and the things themselves. */
export type SectionPreview = { meta: string; items: string }

/** Each section's preview. Read on the server. */
export function sectionPreviews(): Record<SectionId, SectionPreview> {
  const orgs = [...new Set(site.experience.map((role) => role.org))]
  return {
    work: { meta: `${work.length} projects`, items: work.map((w) => w.title).join(', ') },
    about: { meta: 'Bio, contact', items: ['Email', ...site.links.filter((l) => l.kind !== 'mail').map((l) => l.label)].join(', ') },
    experience: { meta: `${site.experience.length} roles`, items: orgs.join(', ') },
    extras: { meta: '2 more', items: 'Scraps, Colophon' },
  }
}
