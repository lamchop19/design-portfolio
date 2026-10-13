import type { Metadata } from 'next'

import { LedLab } from '../_ledlab/led-lab'

export const metadata: Metadata = { title: 'LED lab' }

export default function LedLabPage() {
  return <LedLab />
}
