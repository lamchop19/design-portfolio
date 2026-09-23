import Link from 'next/link'

import type { WorkMeta } from '@/lib/content'

/** Terminal link of a case study — keeps the reader inside the work rather than
 *  dead-ending them at the footer. */
export function NextProject({ meta }: { meta: WorkMeta }) {
  return (
    <nav aria-label="Next project" className="mt-[16vh] border-t border-rule pt-8 pb-[12vh]">
      <span className="font-mono text-xs tracking-wide text-ink-faint uppercase">Next</span>
      <Link
        href={`/work/${meta.slug}`}
        transitionTypes={['nav-forward']}
        className="group mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-2"
      >
        <span className="font-display text-[clamp(2rem,6vw,4.5rem)] leading-none tracking-tight transition-colors group-hover:text-accent">
          {meta.title}
        </span>
        <span className="font-mono text-xs tracking-wide text-ink-faint uppercase">
          {meta.subtitle}
        </span>
      </Link>
    </nav>
  )
}
