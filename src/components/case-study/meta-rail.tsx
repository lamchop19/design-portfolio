import type { WorkMeta } from '@/lib/content'

/**
 * Project facts beside the case study. Pinned alongside the prose on wide
 * screens so the reader keeps the context in view through a long scroll.
 */
export function MetaRail({ meta }: { meta: WorkMeta }) {
  const client = meta.clientUrl ? (
    <a href={meta.clientUrl} target="_blank" rel="noreferrer" className="underline decoration-ink-faint underline-offset-3 hover:text-accent">
      {meta.client}
    </a>
  ) : (
    meta.client
  )

  const fields: Array<[string, React.ReactNode]> = [
    ['Client', client],
    ['Role', meta.role],
    ['Timeline', meta.timeline],
    ['Team', meta.team],
    ['Discipline', meta.subtitle],
  ]

  return (
    <aside aria-label="Project details" className="h-fit self-start md:sticky md:top-12">
      <dl className="flex flex-col">
        {fields.map(([label, value]) => (
          <div key={label} className="border-t border-rule py-3">
            <dt className="t-label text-ink-faint">{label}</dt>
            <dd className="mt-1">{value}</dd>
          </div>
        ))}
      </dl>
      {meta.tags.length > 0 ? (
        <p className="t-label border-t border-rule pt-3 text-ink-faint">
          <span className="sr-only">Tags: </span>
          {meta.tags.join(' · ')}
        </p>
      ) : null}
    </aside>
  )
}
