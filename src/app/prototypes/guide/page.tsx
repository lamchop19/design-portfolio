import type { Metadata } from 'next'
import { Archivo, Bricolage_Grotesque, Doto, Newsreader } from 'next/font/google'

import { logoSvg } from '@/components/brand/logo/source'
import { sectionPreviews } from '@/components/guide/previews'

import { GuideLab } from '../_guide/lab'

export const metadata: Metadata = { title: 'Guide' }

// The faces the lab tries beside the guide's own Geist, loaded only on this page.
const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo', preload: false })
const doto = Doto({ subsets: ['latin'], weight: '800', variable: '--font-doto', preload: false })
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage', preload: false })
const newsreader = Newsreader({ subsets: ['latin'], variable: '--font-newsreader', preload: false })

/** The new homepage from Marc's wireframe, with its options side by side. */
export default function GuidePage() {
  return (
    <GuideLab
      logo={logoSvg('blue', { ns: 'mal-guide', monogram: true })}
      intros={{
        width: logoSvg('blue', { ns: 'mal-intro', card: 'feature presentation' }),
        dots: logoSvg('blue', { ns: 'mal-intro', card: 'feature presentation', cardFit: 'dots' }),
      }}
      previews={sectionPreviews()}
      fontClasses={`${archivo.variable} ${doto.variable} ${bricolage.variable} ${newsreader.variable}`}
    />
  )
}
