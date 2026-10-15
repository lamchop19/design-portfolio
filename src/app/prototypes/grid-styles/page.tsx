import type { Metadata } from 'next'
import { Suspense } from 'react'

import { withCovers } from '@/lib/work-items'
import { work } from '@/../content/work'

import { GridLab } from '../_grids/grid-lab'

export const metadata: Metadata = { title: 'Grid styles' }

export default function GridStylesPage() {
  // The lab reads ?style= from the URL, which a static export can only do in the browser.
  return (
    <Suspense>
      <GridLab items={withCovers(work)} />
    </Suspense>
  )
}
