import type { WorkMeta } from '@/lib/content'

/**
 * Project facts, pinned alongside the prose on wide screens so the reader keeps
 * the context in view through a long scroll. Collapses to a plain block below the
 * two-column breakpoint.
 */
export function MetaRail({ meta }: { meta: WorkMeta }) {
  const rows: Array<[string, React.ReactNode]> = [
    ['Role', meta.role],
    ['Timeline', meta.timeline],
    ['Team', meta.team],
    [
      'Client',
      meta.clientUrl ? (
        <a
          href={meta.clientUrl}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-ink-faint underline-offset-4 transition-colors hover:decoration-accent"
        >
          {meta.client}
        </a>
      ) : (
        meta.client
      ),
    ],
  ]

  return (
    <dl className="h-fit self-start border-t border-rule md:sticky md:top-12">
      {rows.map(([label, value]) => (
        <div key={label} className="border-b border-rule py-3">
          <dt className="font-mono text-[0.6875rem] tracking-wide text-ink-faint uppercase">
            {label}
          </dt>
          <dd className="mt-1 text-sm text-ink">{value}</dd>
        </div>
      ))}
      {meta.tags.length > 0 ? (
        <div className="py-3">
          <dt className="sr-only">Tags</dt>
          <dd className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[0.6875rem] text-ink-faint">
            {meta.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </dd>
        </div>
      ) : null}
    </dl>
  )
}
