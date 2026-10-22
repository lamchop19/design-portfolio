import type { Metadata } from 'next'

import { withCovers } from '@/lib/work-items'
import { work } from '@/../content/work'

import { OnePageLab } from '../_one-page/lab'

export const metadata: Metadata = { title: 'One page' }

export default function OnePagePage() {
  return <OnePageLab items={withCovers(work)} />
}
