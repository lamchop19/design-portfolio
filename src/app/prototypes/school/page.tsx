import type { Metadata } from 'next'

import { logoSvg } from '@/components/brand/logo/source'

import { SchoolLanding } from '../_school/landing'

export const metadata: Metadata = { title: 'School' }

/** Plays the intro from the first frame on a fresh load, as the homepage's head script does. */
const playIntro = `try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.dataset.intro='play'}catch(e){}`

/** Marc's centred landing sketch over the fish school, opening on the Halftone intro with his name under the mark. */
export default function SchoolPage() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: playIntro }} />
      <SchoolLanding introSvg={logoSvg('blue', { ns: 'school-intro' })} logoSvg={logoSvg('blue', { ns: 'school-mark' })} />
    </>
  )
}
