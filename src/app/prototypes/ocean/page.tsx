import type { Metadata } from 'next'
import { Bricolage_Grotesque, Doto, Instrument_Serif } from 'next/font/google'

import { withCovers } from '@/lib/work-items'
import { work } from '@/../content/work'

import { OceanLab } from '../_ocean/ocean-lab'

export const metadata: Metadata = { title: 'Ocean' }

// Candidate faces for the wordmark, loaded only on this page.
const doto = Doto({ subsets: ['latin'], weight: ['600', '800'], variable: '--font-doto', preload: false })
const instrument = Instrument_Serif({ subsets: ['latin'], weight: '400', variable: '--font-instrument', preload: false })
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display-alt', preload: false })

export default function OceanPage() {
  return <OceanLab items={withCovers(work)} fontClasses={`${doto.variable} ${instrument.variable} ${bricolage.variable}`} />
}
