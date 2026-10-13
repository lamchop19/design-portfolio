import type { Metadata } from 'next'

import { withCovers } from '@/lib/work-items'
import { work } from '@/../content/work'

import { Strips } from '../_layouts/strips'

export const metadata: Metadata = { title: 'Layout: flight strips' }

export default function LayoutStripsPage() {
  return <Strips items={withCovers(work)} />
}
