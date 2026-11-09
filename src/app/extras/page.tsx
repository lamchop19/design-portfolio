import type { Metadata } from 'next'
import Link from 'next/link'

import { GuideScreen } from '@/components/guide/guide-screen'

export const metadata: Metadata = { title: 'Extras' }

export default function ExtrasPage() {
  return (
    <GuideScreen section="extras">
      <ul>
        <li>
          <Link href="/scraps" transitionTypes={['nav-forward']}>
            Scraps
          </Link>
          : posters, one-offs and social sets.
        </li>
        <li>
          <strong>Colophon</strong>: how the site was made. Coming with the section screens.
        </li>
      </ul>
    </GuideScreen>
  )
}
