import type { Metadata } from 'next'

import { withCovers } from '@/lib/work-items'
import { work } from '@/../content/work'

import { FlightSigns } from '../_flight/flight-signs'

export const metadata: Metadata = { title: 'The Flight, signs' }

export default function FlightSignsPage() {
  return <FlightSigns items={withCovers(work)} />
}
