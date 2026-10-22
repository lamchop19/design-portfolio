import type { Metadata } from 'next'

import { withCovers } from '@/lib/work-items'
import { work } from '@/../content/work'

import { AquariumLab } from '../_aquarium/lab'

export const metadata: Metadata = { title: 'Aquarium' }

export default function AquariumPage() {
  return <AquariumLab items={withCovers(work)} />
}
