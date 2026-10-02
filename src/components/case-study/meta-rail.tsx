import { BoardingPass } from '@/components/work/boarding-pass'
import type { WorkMeta } from '@/lib/content'

/**
 * Project facts as the case study's boarding pass, matching the project's pass
 * on the homepage. Pinned alongside the prose on wide screens so the reader
 * keeps the context in view through a long scroll.
 */
export function MetaRail({ meta, index }: { meta: WorkMeta; index: number }) {
  return (
    <div className="h-fit self-start md:sticky md:top-12">
      <BoardingPass item={{ meta, cover: null }} index={index} variant="rail" />
    </div>
  )
}
