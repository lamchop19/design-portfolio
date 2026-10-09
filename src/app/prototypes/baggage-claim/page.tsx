import type { Metadata } from 'next'
import { Suspense } from 'react'

import { withCovers } from '@/lib/work-items'
import { work } from '@/../content/work'

import { BaggageClaimLab } from '../_baggage/baggage-claim'
import '../_baggage/baggage.css'

export const metadata: Metadata = { title: 'Baggage claim' }

export default function BaggageClaimPage() {
  // The lab reads ?style= from the URL, which a static export can only do in the browser.
  return (
    <Suspense>
      <BaggageClaimLab items={withCovers(work)} />
    </Suspense>
  )
}
