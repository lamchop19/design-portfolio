import type { Metadata } from 'next'

import { DotMatrix } from '../_dots/dot-matrix'
import { labFontVariables } from '../_lab/fonts'

export const metadata: Metadata = { title: 'Dot-matrix wordmark' }

export default function DotMatrixPage() {
  return <DotMatrix fontVariables={labFontVariables} />
}
