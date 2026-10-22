import type { Metadata } from 'next'
import { Archivo, Doto, Instrument_Serif } from 'next/font/google'

import { withCovers } from '@/lib/work-items'
import { work } from '@/../content/work'

import { DvdLab } from '../_dvd/lab'

export const metadata: Metadata = { title: 'DVD menu' }

// Archivo's width axis gives the wide broadcast wordmark and the condensed menu from one family. Loaded only here.
const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo', preload: false })
// The Index layout's cropped name, after chiquach.com.
const instrument = Instrument_Serif({ subsets: ['latin'], weight: '400', variable: '--font-instrument', preload: false })
// The dotted half of the Split wordmark, after homerradio.
const doto = Doto({ subsets: ['latin'], weight: '800', variable: '--font-doto', preload: false })

export default async function DvdPage() {
  // Case study bodies render here on the server, so the Split layout can open them in its pane.
  const cases = Object.fromEntries(
    await Promise.all(
      work.map(async (meta) => {
        const { default: Body } = await import(`@/../content/work/${meta.slug}/body.mdx`)
        return [meta.slug, <Body key={meta.slug} />] as const
      }),
    ),
  )

  return <DvdLab items={withCovers(work)} cases={cases} fontClass={`${archivo.variable} ${instrument.variable} ${doto.variable}`} />
}
