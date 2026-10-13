import type { Metadata } from 'next'

import { work } from '@/../content/work'

import { ToneIndex } from '../_tone/tone-index'
import { ToneTabs } from '../_tone/tone-tabs'
import '../_tone/tone.css'

export const metadata: Metadata = { title: 'Tone-on-tone' }

export default function ToneOnTonePage() {
  return (
    <>
      <ToneIndex work={work} />
      <ToneTabs />
    </>
  )
}
