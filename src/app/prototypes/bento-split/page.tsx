import type { Metadata } from 'next'

import { withCovers } from '@/lib/work-items'
import { work } from '@/../content/work'

import { SplitTerminal } from '../_bento/split-terminal'

export const metadata: Metadata = { title: 'Bento — split terminal' }

export default function BentoSplitPage() {
  return <SplitTerminal items={withCovers(work)} />
}
