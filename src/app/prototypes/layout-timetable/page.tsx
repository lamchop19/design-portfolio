import type { Metadata } from 'next'

import { withCovers } from '@/lib/work-items'
import { work } from '@/../content/work'

import { Timetable } from '../_layouts/timetable'

export const metadata: Metadata = { title: 'Layout: timetable' }

export default function LayoutTimetablePage() {
  return <Timetable items={withCovers(work)} />
}
