import type { Metadata } from 'next'
import { Suspense } from 'react'

import { withCovers } from '@/lib/work-items'
import { work } from '@/../content/work'

import { NavLab } from '../_nav/nav-lab'

export const metadata: Metadata = { title: 'Nav styles' }

export default function NavStylesPage() {
  // The lab reads ?style= from the URL, which a static export can only do in the browser.
  return (
    <Suspense>
      <NavLab items={withCovers(work)} />
    </Suspense>
  )
}
