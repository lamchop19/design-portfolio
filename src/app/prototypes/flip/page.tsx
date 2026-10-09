import type { Metadata } from 'next'

import { FlipLab } from '../_flight/flip-lab'

export const metadata: Metadata = { title: 'Flip lab' }

export default function FlipLabPage() {
  return <FlipLab />
}
