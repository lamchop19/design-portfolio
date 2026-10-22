import type { Metadata } from 'next'

import { logoSvg, type Colorway } from '@/components/brand/logo/source'

import { LogoLab } from '../_logo/lab'

export const metadata: Metadata = { title: 'Logo motion' }

const COLORWAYS: Colorway[] = ['blue', 'green', 'pink']

/** The Figma exports, as markup, so the lab can place them inline and animate their parts. */
export default function LogoPage() {
  const svgs = Object.fromEntries(COLORWAYS.map((c) => [c, logoSvg(c, { ns: `lg-${c}` })])) as Record<Colorway, string>
  return <LogoLab svgs={svgs} />
}
