import type { Metadata } from 'next'

import { withCovers } from '@/lib/work-items'
import { work } from '@/../content/work'

import { labFontVariables } from '../_lab/fonts'
import { HomeLab } from '../_lab/lab'

export const metadata: Metadata = { title: 'Home lab' }

export default function HomeLabPage() {
  return <HomeLab items={withCovers(work)} fontVariables={labFontVariables} />
}
