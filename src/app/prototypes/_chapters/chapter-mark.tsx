import { chapterNumber, clock, NEON_COUNT, type Chapter } from './chapters'

/**
 * A chapter's title card in the reading view: the number on its neon, the
 * runtime, a bar that fills as the chapter is read (the same fill as its
 * segment on the scrubber) and the heading. Rendered on the server inside the
 * MDX body, in place of each "##". The reading hook finds chapters by
 * `data-chapter` and writes their progress as --f0, --f1… on the disc.
 */
export function ChapterMark({ chapter }: { chapter: Chapter }) {
  const { index, title, seconds } = chapter
  const neon = index % NEON_COUNT

  return (
    <header
      className="ch-mark"
      data-chapter={index}
      id={`chapter-${chapterNumber(index)}`}
      tabIndex={-1}
      style={{ '--c': `var(--neon-${neon})`, '--on-c': `var(--on-neon-${neon})`, '--f': `var(--f${index}, 0)` } as React.CSSProperties}
    >
      <p className="ch-mark-meta">
        <span className="ch-mark-num">
          <span className="sr-only">Chapter </span>
          {chapterNumber(index)}
        </span>
        <span className="ch-mark-time">{clock(seconds)}</span>
      </p>
      <span className="ch-mark-bar" aria-hidden="true">
        <span />
      </span>
      <h2 className="ch-mark-title">{title}</h2>
    </header>
  )
}
