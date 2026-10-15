import type { Metadata } from 'next'

import { withCovers } from '@/lib/work-items'
import { work } from '@/../content/work'

import { DeparturesBoard } from '../_bento/departures-board'

export const metadata: Metadata = { title: 'Bento — departures board' }

export default function BentoBoardPage() {
  return <DeparturesBoard items={withCovers(work)} />
}
