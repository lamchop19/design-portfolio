import type { WorkMeta } from '@/lib/content'
import { getImage, hasImage, type ImageEntry } from '@/lib/images'

export type WorkItem = {
  meta: WorkMeta
  cover: ImageEntry | null
}

/**
 * Pairs each project with its optimized cover. Resolved on the server so client
 * components never touch the image manifest.
 */
export function withCovers(list: WorkMeta[]): WorkItem[] {
  return list.map((meta) => ({
    meta,
    cover: meta.cover && hasImage(meta.cover) ? getImage(meta.cover) : null,
  }))
}

/** "1" → "01". */
export function indexLabel(i: number) {
  return String(i + 1).padStart(2, '0')
}

/** Stand-in fills for projects without cover art, cycled in running order, each with an ink that reads on it. */
const PLACEHOLDERS = [
  { fill: 'var(--brand-blue)', ink: '#0a0f1f' },
  { fill: 'var(--brand-pink)', ink: '#0a0f1f' },
  { fill: 'var(--brand-green)', ink: '#0a0f1f' },
  { fill: '#10364b', ink: '#f2f8fa' },
]

export function placeholder(i: number) {
  return PLACEHOLDERS[i % PLACEHOLDERS.length]
}

/** A flight number for the pass: slug initials and the year's last two digits ("tech-nyu", 2025 → "TN25"). */
export function flightCode(meta: WorkMeta) {
  const words = meta.slug.split('-')
  const letters = words.length > 1 ? words.map((word) => word[0]).join('') : words[0]
  return `${letters.slice(0, 2)}${String(meta.year % 100).padStart(2, '0')}`.toUpperCase()
}

/** The pass's seat is the project's running number: "01A". */
export function seatLabel(i: number) {
  return `${indexLabel(i)}A`
}
