import type { Metadata } from 'next'

import { withCovers } from '@/lib/work-items'
import { work } from '@/../content/work'

import { Seatback } from '../_seatback/seatback'

export const metadata: Metadata = { title: 'Seatback screen' }

export default function SeatbackPage() {
  return <Seatback items={withCovers(work)} />
}
