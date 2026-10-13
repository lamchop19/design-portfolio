import type { Metadata } from 'next'

import { withCovers } from '@/lib/work-items'
import { work } from '@/../content/work'

import { HeroLoadLab } from '../_heroload/hero-load-lab'

export const metadata: Metadata = { title: 'Hero load' }

export default function HeroLoadPage() {
  return <HeroLoadLab items={withCovers(work)} />
}
