import type { Metadata } from 'next'

import { logoSvg } from '@/components/brand/logo/source'
import { work } from '@/../content/work'

import { ScenesLab } from '../_scenes/lab'

export const metadata: Metadata = { title: 'Scenes' }

/** The painted scenes in the homepage's placements; the mark on the sleeve is the site's own. */
export default function ScenesPage() {
  return <ScenesLab mark={logoSvg('blue', { ns: 'sc-mark', monogram: true })} work={work.map((w) => ({ title: w.title, year: w.year, slug: w.slug }))} />
}
