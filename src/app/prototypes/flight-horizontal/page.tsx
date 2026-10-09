import type { Metadata } from 'next'

import { withCovers } from '@/lib/work-items'
import { work } from '@/../content/work'

import { FlightHorizontal } from '../_flight/flight-horizontal'

export const metadata: Metadata = { title: 'The Flight, horizontal' }

export default function FlightHorizontalPage() {
  return <FlightHorizontal items={withCovers(work)} />
}
