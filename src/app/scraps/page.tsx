import type { Metadata } from 'next'
import Image from 'next/image'
import { ViewTransition } from 'react'

import { RevealText } from '@/components/motion/reveal-text'
import { getImage } from '@/lib/images'
import { scraps } from '@/../content/scraps'

export const metadata: Metadata = {
  title: 'Scraps',
  description: 'Posters, one-offs and social sets.',
}

export default function ScrapsPage() {
  return (
    <ViewTransition
      enter={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
      exit={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
      default="none"
    >
      <div className="px-(--page-margin)">
        <header className="pt-[18vh] pb-[10vh]">
          <RevealText className="font-display text-[clamp(2.5rem,7vw,5rem)] leading-[0.95] tracking-tight">
            Scraps
          </RevealText>
          <p className="mt-6 max-w-[42ch] text-lg text-ink-muted">
            Posters, one-offs and social sets that don&rsquo;t warrant a full case study.
          </p>
        </header>

        {scraps.length === 0 ? (
          <p className="border-t border-rule py-16 font-mono text-sm text-ink-faint">
            Nothing here yet.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 pb-[14vh] md:grid-cols-3 md:gap-6">
            {scraps.map((scrap) => {
              const image = getImage(scrap.src)
              return (
                <li
                  key={scrap.src}
                  className={scrap.wide ? 'col-span-2' : undefined}
                >
                  <Image
                    src={image.src}
                    alt={scrap.alt}
                    width={image.width}
                    height={image.height}
                    placeholder="blur"
                    blurDataURL={image.blurDataURL}
                    sizes="(min-width: 768px) 33vw, 50vw"
                    className="h-auto w-full bg-surface-raised"
                  />
                  <p className="mt-2 flex justify-between gap-3 font-mono text-[0.6875rem] text-ink-faint">
                    <span>{scrap.caption ?? scrap.alt}</span>
                    <span className="tabular-nums">{scrap.year}</span>
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </ViewTransition>
  )
}
