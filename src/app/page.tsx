import { ViewTransition } from 'react'

import { LandingFlight } from '@/components/landing/landing-flight'
import { withCovers } from '@/lib/work-items'
import { work } from '@/../content/work'

export default function HomePage() {
  const items = withCovers(work)

  return (
    <ViewTransition
      enter={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
      exit={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
      default="none"
    >
      <LandingFlight items={items} />
    </ViewTransition>
  )
}
