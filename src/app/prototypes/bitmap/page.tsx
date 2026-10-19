import type { Metadata } from 'next'

import { withCovers } from '@/lib/work-items'
import { work } from '@/../content/work'

import { BitmapLab } from '../_bitmap/bitmap-lab'

export const metadata: Metadata = { title: 'Bitmap specimens' }

export default function BitmapPage() {
  return <BitmapLab items={withCovers(work)} />
}
