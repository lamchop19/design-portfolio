import type { Metadata } from 'next'

import { labFontVariables } from '../_lab/fonts'
import { Specimens } from '../_lab/specimens'

export const metadata: Metadata = { title: 'Type specimens' }

export default function TypeSpecimensPage() {
  return <Specimens fontVariables={labFontVariables} />
}
