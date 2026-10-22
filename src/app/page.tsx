import { ViewTransition } from 'react'

import { LogoIntro } from '@/components/brand/logo/logo-intro'
import { logoSvg } from '@/components/brand/logo/source'
import { RuledIndex } from '@/components/home/ruled-index'
import { withCovers } from '@/lib/work-items'
import { work } from '@/../content/work'

export default function HomePage() {
  const items = withCovers(work)

  return (
    <>
      {/* The maL intro, once a visit: it lands in the frame's mark (components/layout/viewport-frame). */}
      <LogoIntro svg={logoSvg('blue', { ns: 'mal-intro' })} target=".vf-mark" />
      <div className="mal-intro-settle">
        <ViewTransition
          enter={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
          exit={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
          default="none"
        >
          <RuledIndex items={items} />
        </ViewTransition>
      </div>
    </>
  )
}
