import type { Metadata } from 'next'

import { withCovers } from '@/lib/work-items'
import { work } from '@/../content/work'

import { Blacklight } from '../_blacklight/blacklight'

export const metadata: Metadata = { title: 'Blacklight' }

export default function BlacklightPage() {
  return <Blacklight items={withCovers(work)} />
}
