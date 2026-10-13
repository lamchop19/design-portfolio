import type { Metadata } from 'next'

import { withCovers } from '@/lib/work-items'
import { work } from '@/../content/work'

import { Wayfinding } from '../_layouts/wayfinding'

export const metadata: Metadata = { title: 'Layout: wayfinding' }

export default function LayoutWayfindingPage() {
  return <Wayfinding items={withCovers(work)} />
}
