import type { Metadata } from 'next'

import { withCovers } from '@/lib/work-items'
import { work } from '@/../content/work'

import { FloorPlan } from '../_bento/floor-plan'

export const metadata: Metadata = { title: 'Bento — floor plan' }

export default function BentoFloorPlanPage() {
  return <FloorPlan items={withCovers(work)} />
}
