import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Scraps' }

export default function ScrapsPage() {
  return (
    <div className="px-(--page-margin) pt-32 pb-24">
      <h1 className="font-display text-[clamp(2.5rem,7vw,5rem)] leading-[0.95] tracking-tight">
        Scraps
      </h1>
      <p className="mt-8 max-w-[48ch] text-ink-muted">
        Posters, one-offs and social sets that don&rsquo;t warrant a full case study.
      </p>
    </div>
  )
}
