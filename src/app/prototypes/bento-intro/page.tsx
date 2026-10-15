import type { Metadata } from 'next'

import { withCovers } from '@/lib/work-items'
import { work } from '@/../content/work'

import { IntroLab } from '../_bento/intro/intro-lab'

export const metadata: Metadata = { title: 'Bento — load intros' }

export default function BentoIntroPage() {
  return <IntroLab items={withCovers(work)} />
}
