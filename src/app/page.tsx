import { ViewTransition } from 'react'

import { RevealText } from '@/components/motion/reveal-text'
import { WorkIndex, type WorkIndexItem } from '@/components/work/work-index'
import { hasImage, getImage } from '@/lib/images'
import { site } from '@/../content/site'
import { work } from '@/../content/work'

export default function HomePage() {
  // Covers are resolved on the server so the client component never touches the
  // manifest. Until a project has artwork, its hover preview is simply absent.
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
      <div className="px-(--page-margin)">
        <header className="pt-[18vh] pb-[14vh]">
          <RevealText className="max-w-[14ch] font-display text-[clamp(2.75rem,9vw,7.5rem)] leading-[0.95] tracking-tight">
            {site.headline}
          </RevealText>
        </header>

        <section aria-labelledby="work-heading">
          <h2 id="work-heading" className="sr-only">
            Selected work
          </h2>
          <WorkIndex items={items} />
        </section>

        <section aria-labelledby="about-heading" className="py-[14vh]">
          <h2
            id="about-heading"
            className="font-mono text-xs tracking-wide text-ink-faint uppercase"
          >
            About
          </h2>
          <RevealText
            as="p"
            onScroll
            className="mt-6 max-w-[38ch] font-display text-[clamp(1.5rem,3.5vw,2.5rem)] leading-[1.15] tracking-tight"
          >
            {site.bio}
          </RevealText>
        </section>
      </div>
    </ViewTransition>
  )
}
