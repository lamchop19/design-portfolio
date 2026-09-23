import { site } from '@/../content/site'

export default function HomePage() {
  return (
    <div className="px-(--page-margin) pt-32 pb-24">
      <h1 className="max-w-[14ch] font-display text-[clamp(2.75rem,9vw,7.5rem)] leading-[0.95] tracking-tight text-balance">
        {site.headline}
      </h1>
      <p className="mt-10 max-w-[48ch] text-lg text-ink-muted">{site.bio}</p>
    </div>
  )
}
