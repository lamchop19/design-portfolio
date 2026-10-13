import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { MetaRail } from '@/components/case-study/meta-rail'
import { WindowShade } from '@/components/layout/window-shade'
import { getImage, hasImage } from '@/lib/images'
import { flightCode } from '@/lib/work-items'
import { getWork, work } from '@/../content/work'

import { ToneTabs } from '../../_tone/tone-tabs'
import { toneFor, toneVars } from '../../_tone/palette'
import '../../_tone/tone.css'

export function generateStaticParams() {
  return work.map((w) => ({ slug: w.slug }))
}

// Static export cannot render slugs that weren't built.
export const dynamicParams = false

export async function generateMetadata(props: PageProps<'/prototypes/tone-on-tone/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params
  const meta = getWork(slug)
  return meta ? { title: `Tone-on-tone, ${meta.title}` } : {}
}

/** The case study, recoloured: same prose and rail as /work/[slug], in the project's own hue. */
export default async function ToneCaseStudy(props: PageProps<'/prototypes/tone-on-tone/[slug]'>) {
  const { slug } = await props.params
  const meta = getWork(slug)
  if (!meta) notFound()

  const index = work.indexOf(meta)
  const tone = toneFor(meta.slug, index)
  const { default: Body } = await import(`@/../content/work/${slug}/body.mdx`)
  const cover = meta.cover && hasImage(meta.cover) ? getImage(meta.cover) : null

  return (
    <div className="tt-page" style={toneVars(tone)}>
      <header className="tt-hero">
        <div className="t-label flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <Link href="/prototypes/tone-on-tone" className="underline-offset-4 hover:underline">
            ← All flights
          </Link>
          <span className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span>
              Flight {flightCode(meta)} · {meta.subtitle} · {meta.year}
            </span>
            <span className="tt-shade">
              <WindowShade inline />
            </span>
          </span>
        </div>
        <div className="grid gap-8">
          <h1 className="tt-title">{meta.title}</h1>
          <p className="tt-headline">{meta.headline}</p>
        </div>
      </header>

      <article className="px-(--page-margin)">
        {cover ? (
          <Image
            src={cover.src}
            alt=""
            width={cover.width}
            height={cover.height}
            placeholder="blur"
            blurDataURL={cover.blurDataURL}
            priority
            sizes="100vw"
            className="mt-(--page-margin) max-h-[70vh] w-full bg-surface-raised object-cover"
          />
        ) : null}

        <div className="grid gap-12 py-16 md:grid-cols-[16rem_minmax(0,68ch)] md:gap-20 md:py-24">
          <MetaRail meta={meta} index={index} />
          <div className="min-w-0">
            <Body />
          </div>
        </div>
      </article>

      <ToneTabs current={meta.slug} />
    </div>
  )
}
