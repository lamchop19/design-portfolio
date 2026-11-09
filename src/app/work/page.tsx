import type { Metadata } from 'next'
import Link from 'next/link'

import { GuideScreen } from '@/components/guide/guide-screen'
import { work } from '@/../content/work'

export const metadata: Metadata = { title: 'Featured work' }

export default function FeaturedWorkPage() {
  return (
    <GuideScreen section="work">
      <ol>
        {work.map((w) => (
          <li key={w.slug}>
            <Link href={`/work/${w.slug}`} transitionTypes={['nav-forward']}>
              {w.title}
            </Link>
            , {w.subtitle} · {w.year}
          </li>
        ))}
      </ol>
    </GuideScreen>
  )
}
