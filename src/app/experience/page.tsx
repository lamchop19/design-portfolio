import type { Metadata } from 'next'

import { GuideScreen } from '@/components/guide/guide-screen'
import { site } from '@/../content/site'

export const metadata: Metadata = { title: 'Experience' }

export default function ExperiencePage() {
  return (
    <GuideScreen section="experience">
      <ol>
        {site.experience.map((role) => (
          <li key={`${role.org}-${role.role}`}>
            <strong>{role.role}</strong>, {role.org} · {role.when}
          </li>
        ))}
      </ol>
    </GuideScreen>
  )
}
