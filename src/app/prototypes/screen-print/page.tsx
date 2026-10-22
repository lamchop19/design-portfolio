import type { Metadata } from 'next'

import { withCovers } from '@/lib/work-items'
import { work } from '@/../content/work'

import { ScreenPrintLab } from '../_screen-print/lab'

export const metadata: Metadata = { title: 'Screen print' }

export default function ScreenPrintPage() {
  return <ScreenPrintLab items={withCovers(work)} />
}
