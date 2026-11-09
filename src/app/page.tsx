import { ViewTransition } from 'react'

import { LogoIntro } from '@/components/brand/logo/logo-intro'
import { logoSvg } from '@/components/brand/logo/source'
import { GuideLanding } from '@/components/guide/landing'
import { sectionPreviews } from '@/components/guide/previews'

export default function HomePage() {
  return (
    <>
      {/* The maL intro, once a visit: it lands on the guide's mark (components/guide). */}
      <LogoIntro svg={logoSvg('blue', { ns: 'mal-intro', card: 'feature presentation' })} target=".guide-logo" />
      <ViewTransition
        enter={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
        exit={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
        default="none"
      >
        <GuideLanding logo={logoSvg('blue', { ns: 'mal-guide', monogram: true })} previews={sectionPreviews()} />
      </ViewTransition>
    </>
  )
}
