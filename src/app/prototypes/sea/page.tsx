import type { Metadata } from 'next'

import { withCovers } from '@/lib/work-items'
import { work } from '@/../content/work'

import { Sea } from '../_sea/sea'

export const metadata: Metadata = { title: 'Sea' }

export default function SeaPage() {
  return <Sea items={withCovers(work)} />
}
