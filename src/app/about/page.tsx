import type { Metadata } from 'next'

import { GuideScreen } from '@/components/guide/guide-screen'
import { asset } from '@/lib/paths'
import { site } from '@/../content/site'

export const metadata: Metadata = { title: 'About' }

/* TODO(content): the long bio. Contact lives here, as there's no Contact in the menu. */
export default function AboutPage() {
  return (
    <GuideScreen section="about">
      <p>{site.bio}</p>
      <ul className="mt-6">
        <li>
          <a href={`mailto:${site.email}`}>{site.email}</a>
        </li>
        {site.links
          .filter((link) => link.kind !== 'mail')
          .map((link) => (
            <li key={link.label}>
              <a href={link.kind === 'asset' ? asset(link.href) : link.href} target="_blank" rel="noreferrer">
                {link.label} ↗
              </a>
            </li>
          ))}
      </ul>
    </GuideScreen>
  )
}
