import { ViewTransition } from 'react'

import { NameHero } from '@/components/brand/name-hero'
import { WorkIndex, type WorkIndexItem } from '@/components/work/work-index'
import { hasImage, getImage } from '@/lib/images'
import { site } from '@/../content/site'
import { work } from '@/../content/work'

export default function HomePage() {
  // Covers are resolved on the server so the client component never touches the
  // manifest. Until a project has artwork, its thumbnail is a flat brand color.
  const items: WorkIndexItem[] = work.map((meta) => ({
    meta,
    cover: meta.cover && hasImage(meta.cover) ? getImage(meta.cover) : null,
  }))

  return (
    <ViewTransition
      enter={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
      exit={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
      default="none"
    >
      {/* data-snap marks the section starts that SmoothScroll settles onto. */}
      <header className="sky-hero" data-snap>
        <div className="sky-clouds" aria-hidden="true">
          <span className="sky-cloud-far" />
          <span className="sky-cloud-near" />
        </div>
        <NameHero name={site.name} />
      </header>

      <section
        aria-labelledby="work-heading"
        className="home-section px-(--page-margin)"
        data-snap
      >
        <h2 id="work-heading" className="home-section-label">
          Selected work <span className="tabular-nums">({String(items.length).padStart(2, '0')})</span>
        </h2>
        <WorkIndex items={items} />
      </section>

      <section
        aria-labelledby="about-heading"
        className="home-section home-about px-(--page-margin)"
        data-snap
      >
        <h2 id="about-heading" className="home-section-label">
          About
        </h2>
        <p className="max-w-[38ch] font-display text-[clamp(1.75rem,4vw,3.25rem)] leading-[1.12] tracking-tight text-balance">
          {site.bio}
        </p>
      </section>
    </ViewTransition>
  )
}
