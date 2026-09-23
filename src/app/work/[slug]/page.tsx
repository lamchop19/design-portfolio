import { notFound } from 'next/navigation'
import { ViewTransition } from 'react'
import Image from 'next/image'

import { MetaRail } from '@/components/case-study/meta-rail'
import { NextProject } from '@/components/case-study/next-project'
import { hasImage, getImage } from '@/lib/images'
import { getNextWork, getWork, work } from '@/../content/work'

export function generateStaticParams() {
  return work.map((w) => ({ slug: w.slug }))
}

// Static export cannot render slugs that weren't built.
export const dynamicParams = false

export async function generateMetadata(props: PageProps<'/work/[slug]'>) {
  const { slug } = await props.params
  const meta = getWork(slug)
  if (!meta) return {}
  return {
    title: `${meta.title} — ${meta.subtitle}`,
    description: meta.headline,
  }
}

export default async function WorkPage(props: PageProps<'/work/[slug]'>) {
  const { slug } = await props.params
  const meta = getWork(slug)
  if (!meta) notFound()

  const { default: Body } = await import(`@/../content/work/${slug}/body.mdx`)
  const cover = meta.cover && hasImage(meta.cover) ? getImage(meta.cover) : null
  const next = getNextWork(slug)

  return (
    <ViewTransition
      enter={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
      exit={{ 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'none' }}
      default="none"
    >
      <article className="px-(--page-margin)">
        <header className="pt-[14vh] pb-12">
          <h1 className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
            <span className="font-display text-[clamp(2.5rem,8vw,6rem)] leading-[0.95] tracking-tight">
              {meta.title}
            </span>
            <span className="font-mono text-xs tracking-wide text-ink-faint uppercase">
              {meta.subtitle}
            </span>
          </h1>
        </header>

        {/* Receiving half of the shared-element morph — the name matches the
            cursor preview on the work index. */}
        {cover ? (
          <ViewTransition name={`cover-${meta.slug}`} share="morph" default="none">
            <Image
              src={cover.src}
              alt=""
              width={cover.width}
              height={cover.height}
              placeholder="blur"
              blurDataURL={cover.blurDataURL}
              priority
              sizes="100vw"
              className="h-auto w-full bg-surface-raised"
            />
          </ViewTransition>
        ) : null}

        <div className="mt-16 grid gap-12 md:grid-cols-[16rem_minmax(0,68ch)] md:gap-20">
          <MetaRail meta={meta} />
          <div className="min-w-0">
            <p className="mb-14 font-display text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.1] tracking-tight text-balance">
              {meta.headline}
            </p>
            <Body />
          </div>
        </div>

        {next ? <NextProject meta={next} /> : null}
      </article>
    </ViewTransition>
  )
}
