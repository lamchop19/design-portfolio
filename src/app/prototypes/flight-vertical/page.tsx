import type { Metadata } from 'next'

import { withCovers } from '@/lib/work-items'
import { work } from '@/../content/work'

import { FlightVertical } from '../_flight/flight-vertical'

export const metadata: Metadata = { title: 'The Flight, vertical' }

export default function FlightVerticalPage() {
  return <FlightVertical items={withCovers(work)} />
}
