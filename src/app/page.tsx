import { ViewTransition } from 'react'

import { LogoIntro } from '@/components/brand/logo/logo-intro'
import { logoSvg } from '@/components/brand/logo/source'
import { GuideLanding } from '@/components/guide/landing'
import { sectionPreviews } from '@/components/guide/previews'
import { LANDING_ONLY } from '@/lib/site-mode'

import { SchoolLanding } from './prototypes/_school/landing'
import { LANDING_LOOK } from './prototypes/_school/landing-look'

export default function HomePage() {
  // The live landing on its own (lib/site-mode): the fish school, links to come.
  if (LANDING_ONLY)
    return (
      <SchoolLanding
        introSvg={logoSvg('blue', { ns: 'school-intro' })}
        logoSvg={logoSvg('blue', { ns: 'school-mark' })}
        initialLook={LANDING_LOOK}
        lab={false}
        placeholders
        alwaysIntro={false}
      />
    )

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
