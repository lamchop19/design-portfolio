/*
 * The case study as a disc: its body split into chapters at the "##"
 * headings, each with a runtime, the way a disc's scene selection lists its
 * chapters. The runtime is the reading time, words at 200 a minute, so a
 * chapter is as long as it takes to read. Plain data, shared by the page
 * (server) and the lab (client).
 */

export type Chapter = {
  /** 0-based, in reading order. */
  index: number
  title: string
  /** True for the opening paragraphs before the first heading, which have no heading of their own. */
  intro: boolean
  words: number
  /** Reading time at 200 words a minute. */
  seconds: number
}

/** One disc: a project's chapters and its body, rendered on the server with chapter marks in place. */
export type Disc = {
  slug: string
  chapters: Chapter[]
  body: React.ReactNode
}

const WORDS_PER_MINUTE = 200

/** Counts the words a reader reads: no JSX, imports or exports, link targets or markdown punctuation. */
function countWords(text: string) {
  const plain = text
    .replace(/^(import|export)\s.*$/gm, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_>`~|-]+/g, ' ')
  return plain.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length
}

/**
 * Splits an MDX body into chapters at its "##" headings. Whatever comes
 * before the first heading is chapter 1, "Intro"; a body that opens with a
 * heading has no intro chapter.
 */
export function splitChapters(source: string): Chapter[] {
  const chunks: { title: string; intro: boolean; lines: string[] }[] = [{ title: 'Intro', intro: true, lines: [] }]
  for (const line of source.split('\n')) {
    const heading = /^##\s+(.+?)\s*$/.exec(line)
    if (heading) chunks.push({ title: heading[1], intro: false, lines: [] })
    else chunks[chunks.length - 1].lines.push(line)
  }
  return chunks
    .map((chunk) => ({ ...chunk, words: countWords(chunk.lines.join('\n')) }))
    .filter((chunk) => !chunk.intro || chunk.words > 0)
    .map(({ title, intro, words }, index) => ({
      index,
      title,
      intro,
      words,
      seconds: Math.max(1, Math.round((words / WORDS_PER_MINUTE) * 60)),
    }))
}

/** 72 → "01:12". */
export function clock(seconds: number) {
  const s = Math.max(0, Math.round(seconds))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

/** 0 → "01". */
export const chapterNumber = (index: number) => String(index + 1).padStart(2, '0')

/** Each chapter takes one of four neons, in this order, so a three-chapter disc never lands on the yellow. */
export const NEON_COUNT = 4
