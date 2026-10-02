import Link from 'next/link'

import { FlapText } from '@/components/split-flap/split-flap'

export default function NotFound() {
  return (
    <div className="swiss-grid gap-y-6 pt-[22vh] pb-[18vh]">
      <p className="t-label col-span-full text-ink-faint">Error 404</p>
      <h1 className="col-span-full text-[clamp(2rem,9vw,6.5rem)] leading-none font-medium">
        <FlapText text="Gate not found" trigger="load" intro="quick" delay={150} />
      </h1>
      <p className="col-span-full max-w-[40ch] text-lg leading-7 text-ink-muted md:col-span-6">
        This flight doesn&rsquo;t exist, or it&rsquo;s been moved.
      </p>
      <Link
        href="/"
        transitionTypes={['nav-back']}
        className="t-label col-span-full mt-4 w-fit transition-colors hover:text-accent"
      >
        ← Return to departures
      </Link>
    </div>
  )
}
