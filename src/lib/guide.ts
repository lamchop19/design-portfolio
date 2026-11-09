import type { Route } from 'next'

/*
 * The guide: the homepage's menu and the screens it opens, after the Sky
 * Guide (Marc's "new layout" wireframe). One list, read by the landing's
 * menu, the screens' header and the paths helpers.
 */

export type SectionId = 'work' | 'about' | 'experience' | 'extras'

export type GuideSection = {
  id: SectionId
  /** Lowercase, as the wireframe sets it. */
  label: string
  href: Route
}

export const GUIDE_SECTIONS: GuideSection[] = [
  { id: 'work', label: 'featured work', href: '/work' },
  { id: 'about', label: 'about', href: '/about' },
  { id: 'experience', label: 'experience', href: '/experience' },
  { id: 'extras', label: 'extras', href: '/extras' },
]
